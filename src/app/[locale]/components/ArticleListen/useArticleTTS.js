"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Convierte el HTML del artículo en bloques de texto (párrafos/títulos).
export function htmlToBlocks(html) {
  if (!html || typeof window === "undefined") return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = [];
  doc.body
    .querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote")
    .forEach((el) => {
      const text = el.textContent.trim();
      if (text) blocks.push(text);
    });
  if (blocks.length === 0) {
    const t = doc.body.textContent.trim();
    if (t) blocks.push(t);
  }
  return blocks;
}

// Range sobre los nodos de texto de `el` cubriendo [start, start+length).
// Usado por el resaltado palabra-por-palabra (CSS Custom Highlight API).
export function rangeForOffset(el, start, length) {
  const end = start + length;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  let pos = 0;
  let startNode = null;
  let startOff = 0;
  let endNode = null;
  let endOff = 0;
  while ((node = walker.nextNode())) {
    const len = node.nodeValue.length;
    if (startNode === null && start < pos + len) {
      startNode = node;
      startOff = start - pos;
    }
    if (startNode !== null && end <= pos + len) {
      endNode = node;
      endOff = end - pos;
      break;
    }
    pos += len;
  }
  if (!startNode) return null;
  if (!endNode) {
    endNode = startNode;
    endOff = startNode.nodeValue.length;
  }
  try {
    const r = document.createRange();
    r.setStart(startNode, Math.max(0, startOff));
    r.setEnd(endNode, Math.min(endNode.nodeValue.length, endOff));
    return r;
  } catch {
    return null;
  }
}

// Heurística de calidad de voz: las de red (no localService) y las que en el
// nombre traen Google/Premium/Enhanced/Neural/Natural suenan claramente mejor
// que las compactas del sistema.
const HQ_KEYWORDS = /google|premium|enhanced|neural|natural|wavenet|siri/i;
export function isHQVoice(v) {
  return v?.localService === false || HQ_KEYWORDS.test(v?.name || "");
}
function voiceScore(v) {
  let s = 0;
  if (v?.localService === false) s += 2; // de red (Google, etc.)
  if (HQ_KEYWORDS.test(v?.name || "")) s += 1;
  return s;
}

// Etiqueta amigable para el selector: por código de idioma (sin mencionar
// "Estados Unidos" ni la marca "Google").
export function voiceLabel(v) {
  const code = (v?.lang || "").toLowerCase();
  if (code === "es-us" || code === "es-419" || code === "es-mx") {
    return "español latam";
  }
  if (code === "es-es") return "español España";
  const cleaned = (v?.name || "")
    .replace(/google/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || v?.name || "Voz";
}

// Aproximación de velocidad de lectura (caracteres por segundo a rate 1).
// Las voces de red no emiten eventos de palabra, así que el resaltado
// palabra-por-palabra se estima por tiempo con esta constante.
export const CHARS_PER_SEC = 14;

// Parte los bloques en segmentos cortos (oraciones). Chrome corta los
// utterances largos (~15s), así que conviene leer oración por oración.
// Cada segmento guarda su offset dentro del bloque y la lista de palabras
// (offset + longitud, relativos al bloque) para el resaltado por tiempo.
function buildSegments(blocks) {
  const segs = [];
  blocks.forEach((b, bi) => {
    // Cortar en . ! ? — salvo cuando el "." sigue a un dígito: en alemán "1."
    // es un ordinal/fecha ("1. Oktober"), no fin de oración. Sin esto, la fecha
    // se parte en dos segmentos y no se puede pronunciar como ordinal.
    const sentences = b.match(
      /(?:[^.!?]|(?<=\d)\.)+(?:[.!?]+|$)/g
    ) || [b];
    let cursor = 0;
    sentences.forEach((s) => {
      const at = b.indexOf(s, cursor);
      const base = at >= 0 ? at : cursor;
      cursor = base + s.length;
      const lead = s.length - s.trimStart().length;
      const offset = base + lead;
      const t = s.trim();
      if (!t) return;
      const words = [];
      let m;
      const re = /\S+/g;
      while ((m = re.exec(t))) {
        words.push({ start: offset + m.index, length: m[0].length });
      }
      segs.push({ blockIndex: bi, text: t, offset, words });
    });
  });
  return segs;
}

// Motor de Text-to-Speech sobre la Web Speech API del navegador.
// `lang` = "de" | "es". Devuelve estado + controles para construir cualquier UI.
export function useArticleTTS(lang = "de") {
  const [currentBlock, setCurrentBlock] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState("");

  // Progreso por segmento (oración), mapa segmento→bloque y palabra actual.
  const [segIndex, setSegIndex] = useState(0);
  const [segTotal, setSegTotal] = useState(0);
  const [segBlocks, setSegBlocks] = useState([]);
  // Metadatos por segmento para mapear posición de caracteres → segmento
  // (necesario para que una barra de progreso sea seekable por click).
  const [segMeta, setSegMeta] = useState([]); // { blockIndex, offset, length }
  const [word, setWord] = useState(null); // { blockIndex, start, length }

  // Se resuelve tras el montaje para evitar mismatch de hidratación.
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(typeof window !== "undefined" && !!window.speechSynthesis);
  }, []);

  const segmentsRef = useRef([]);
  // Transforma el texto SOLO al hablarlo (ila/y/fechas). Los offsets del
  // resaltado se calculan sobre el texto original, así que esta transformación
  // puede cambiar el largo sin desalinear nada.
  const speakRef = useRef(null);
  const cancelledRef = useRef(false);
  const segRef = useRef(null); // segmento que se está leyendo
  const segStartRef = useRef(0); // timestamp (wall-clock) en que arrancó
  const pauseStartRef = useRef(0); // timestamp en que se pausó (para compensar)
  const rateRef = useRef(rate);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  // Refs espejo del estado para el reenganche por visibilidad de pestaña.
  const playingRef = useRef(false);
  const pausedRef = useRef(false);
  const segIndexRef = useRef(0);
  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    segIndexRef.current = segIndex;
  }, [segIndex]);

  // Cargar voces disponibles del navegador.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Voces del idioma. Preferimos SOLO las de red (Google): las del sistema son
  // inconsistentes (a veces nítidas, a veces no). Si no hay de red (Safari/
  // Firefox), caemos a todas para no dejar el selector vacío.
  const langPrefix = lang === "de" ? "de" : "es";
  const langCandidates = voices.filter((v) =>
    v.lang?.toLowerCase().startsWith(langPrefix)
  );
  const networkVoices = langCandidates.filter((v) => v.localService === false);
  const langVoices = (networkVoices.length ? networkVoices : langCandidates).sort(
    (a, b) => voiceScore(b) - voiceScore(a)
  );

  // Elegir la mejor voz por defecto al cambiar voces o idioma.
  useEffect(() => {
    if (langVoices.length === 0) return;
    const stillValid = langVoices.some((v) => v.voiceURI === voiceURI);
    if (!stillValid) setVoiceURI(langVoices[0].voiceURI);
  }, [voices, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = useCallback(() => {
    cancelledRef.current = true;
    segRef.current = null;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentBlock(null);
    setWord(null);
    setSegIndex(0);
  }, []);

  // Parar el audio al desmontar.
  useEffect(() => () => stop(), [stop]);

  // Keepalive: Chrome detiene speechSynthesis tras ~15s. resume() periódico.
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      const ss = window.speechSynthesis;
      if (ss && ss.speaking && !ss.paused) ss.resume();
    }, 8000);
    return () => clearInterval(id);
  }, [isPlaying]);

  // Resaltado palabra-por-palabra estimado por TIEMPO DE RELOJ (las voces de red
  // no emiten onboundary). La palabra actual se deriva de cuánto tiempo lleva
  // sonando el segmento (segStartRef), no de timers encadenados. Así, si la
  // pestaña estuvo en segundo plano (donde el navegador frena los timers), al
  // volver el cálculo se re-sincroniza solo con el tiempo transcurrido real.
  const computeWord = useCallback(() => {
    const seg = segRef.current;
    if (!seg || cancelledRef.current) return;
    const words = seg.words;
    if (!words.length) return;
    const cps = CHARS_PER_SEC * (rateRef.current || 1);
    const charsRead = ((Date.now() - segStartRef.current) / 1000) * cps;
    let k = 0;
    for (let j = 0; j < words.length; j++) {
      if (words[j].start - seg.offset <= charsRead) k = j;
      else break;
    }
    const w = words[k];
    setWord({ blockIndex: seg.blockIndex, start: w.start, length: w.length });
  }, []);

  // Tick único mientras se reproduce: recalcula la palabra actual cada 120ms.
  // En segundo plano el navegador frena este intervalo, pero al volver el primer
  // tick recalcula por reloj y salta a la palabra correcta automáticamente.
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    computeWord();
    const id = setInterval(computeWord, 120);
    return () => clearInterval(id);
  }, [isPlaying, isPaused, computeWord]);

  const speakFrom = useCallback(
    (i) => {
      const segs = segmentsRef.current;
      if (i >= segs.length) {
        segRef.current = null;
        setIsPlaying(false);
        setCurrentBlock(null);
        setWord(null);
        return;
      }
      const seg = segs[i];
      const spoken = speakRef.current ? speakRef.current(seg.text) : seg.text;
      const u = new SpeechSynthesisUtterance(spoken);
      const voice = voices.find((v) => v.voiceURI === voiceURI);
      if (voice) u.voice = voice;
      u.lang = lang === "de" ? "de-DE" : "es-ES";
      u.rate = rate;
      setCurrentBlock(seg.blockIndex);
      setSegIndex(i);
      u.onstart = () => {
        if (cancelledRef.current) return;
        segRef.current = seg;
        segStartRef.current = Date.now();
        computeWord();
      };
      u.onend = () => {
        if (!cancelledRef.current) speakFrom(i + 1);
      };
      u.onerror = () => {
        if (!cancelledRef.current) speakFrom(i + 1);
      };
      window.speechSynthesis.speak(u);
    },
    [voices, voiceURI, lang, rate, computeWord]
  );

  // Arranca la lectura de `blocks` (string[]). Si estaba en pausa, reanuda.
  const play = useCallback(
    (blocks, speak) => {
      if (isPaused) {
        // Compensar el tiempo en pausa para que el resaltado no salte adelante.
        if (pauseStartRef.current) {
          segStartRef.current += Date.now() - pauseStartRef.current;
          pauseStartRef.current = 0;
        }
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsPlaying(true);
        return;
      }
      speakRef.current = typeof speak === "function" ? speak : null;
      const segs = buildSegments(blocks || []);
      segmentsRef.current = segs;
      setSegTotal(segs.length);
      setSegBlocks(segs.map((s) => s.blockIndex));
      setSegMeta(
        segs.map((s) => ({
          blockIndex: s.blockIndex,
          offset: s.offset,
          length: s.text.length,
        }))
      );
      cancelledRef.current = false;
      setIsPlaying(true);
      setIsPaused(false);
      window.speechSynthesis.cancel();
      speakFrom(0);
    },
    [isPaused, speakFrom]
  );

  const pause = useCallback(() => {
    pauseStartRef.current = Date.now();
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  // Saltar a un segmento (oración) concreto — alimenta la barra de progreso.
  const seek = useCallback(
    (i) => {
      const segs = segmentsRef.current;
      if (!segs.length) return;
      const idx = Math.max(0, Math.min(segs.length - 1, Math.round(i)));
      cancelledRef.current = true;
      window.speechSynthesis.cancel();
      setWord(null);
      setTimeout(() => {
        cancelledRef.current = false;
        setIsPlaying(true);
        setIsPaused(false);
        speakFrom(idx);
      }, 60);
    },
    [speakFrom]
  );

  // Cambio de velocidad en caliente: la Web Speech API no deja cambiar el rate
  // de un utterance en curso, así que re-locutamos SOLO la oración actual con
  // la nueva velocidad (no se vuelve al principio). Debounce para no reiniciar
  // en cada pasito mientras se arrastra el slider.
  const firstRateRun = useRef(true);
  const rateApplyRef = useRef(null);
  useEffect(() => {
    if (firstRateRun.current) {
      firstRateRun.current = false;
      return;
    }
    if (!playingRef.current || pausedRef.current) return;
    if (rateApplyRef.current) clearTimeout(rateApplyRef.current);
    rateApplyRef.current = setTimeout(() => {
      const idx = segIndexRef.current;
      cancelledRef.current = true;
      window.speechSynthesis.cancel();
      setTimeout(() => {
        cancelledRef.current = false;
        speakFrom(idx);
      }, 60);
    }, 250);
    return () => {
      if (rateApplyRef.current) clearTimeout(rateApplyRef.current);
    };
  }, [rate, speakFrom]);

  // Reenganche al volver a la pestaña: Chrome corta el audio en background.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      const ss = window.speechSynthesis;
      if (!ss || !playingRef.current || pausedRef.current) return;
      if (ss.paused) {
        ss.resume();
        return;
      }
      if (!ss.speaking) {
        // El audio se cortó en background: re-arrancamos desde el segmento
        // actual. Si seguía hablando, el intervalo de computeWord re-sincroniza
        // el resaltado solo, sin reiniciar el audio.
        cancelledRef.current = true;
        ss.cancel();
        setTimeout(() => {
          cancelledRef.current = false;
          speakFrom(segIndexRef.current);
        }, 60);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [speakFrom]);

  return {
    supported,
    langVoices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    isPlaying,
    isPaused,
    currentBlock,
    segIndex,
    segTotal,
    segBlocks,
    segMeta,
    word,
    play,
    pause,
    stop,
    seek,
  };
}

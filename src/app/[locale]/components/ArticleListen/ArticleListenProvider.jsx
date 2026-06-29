"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FaPlay, FaPause, FaStop } from "react-icons/fa";
import { useArticleTTS, htmlToBlocks, voiceLabel } from "./useArticleTTS";

const HIGHLIGHT_NAME = "tts-word";
const SUPER_ADMIN_EMAIL = "e.zeangeloni@gmail.com";

const ArticleListenContext = createContext(null);
export const useArticleListen = () => useContext(ArticleListenContext);

// Recolecta del DOM los elementos legibles en orden: título, subtítulo,
// Vorspann (standfirst) y cada bloque del cuerpo. Cada bloque hablado es un
// elemento real → se puede resaltar mientras se lee.
function collectTargets() {
  const targets = [];
  const titleEl = document.querySelector('[data-tts="title"]');
  const subEl = document.querySelector('[data-tts="subtitle"]');
  if (titleEl) targets.push(titleEl);
  if (subEl) targets.push(subEl);
  const vorspann = document.querySelector('[data-tts="vorspann"]');
  if (vorspann) {
    const vBlocks = vorspann.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, li, blockquote"
    );
    if (vBlocks.length) vBlocks.forEach((el) => targets.push(el));
    else targets.push(vorspann);
  }
  const body = document.querySelector(
    '.article-content[itemprop="articleBody"]'
  );
  if (body) {
    body
      .querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote")
      .forEach((el) => targets.push(el));
  }
  return targets.filter((el) => el.textContent.trim());
}

// Range sobre los nodos de texto de `el` cubriendo [start, start+length).
function rangeForOffset(el, start, length) {
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

// Provee el motor "Escuchar" a la página de artículo. El disparador vive en la
// ShareBar (toolbar izquierda); este provider corre el TTS, resalta el texto y
// pinta la toolbar flotante de controles.
export function ArticleListenProvider({
  isAdmin = false,
  hasPdfAbo = false,
  role = null,
  email = null,
  lang = "de",
  title,
  subtitle,
  content,
  children,
}) {
  const tts = useArticleTTS(lang);
  const isDE = lang === "de";

  const [flags, setFlags] = useState(null);
  const isSuperAdmin = email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    let activeReq = true;
    fetch("/api/feature-flags")
      .then((r) => r.json())
      .then((d) => {
        if (activeReq) setFlags(d);
      })
      .catch(() => {});
    return () => {
      activeReq = false;
    };
  }, []);

  // Elegibilidad: el super-admin siempre; el resto según flags + audiencia.
  let canListen = isSuperAdmin;
  if (!canListen && flags?.listen) {
    const l = flags.listen;
    const isTranslator = role === "translator";
    canListen =
      (isAdmin && l.admin) ||
      (hasPdfAbo && l.digitalabo) ||
      (isTranslator && l.translator) ||
      l.user;
  }

  const elsRef = useRef([]);
  const activeElRef = useRef(null);
  const [scrub, setScrub] = useState(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const supportsHighlight =
    typeof window !== "undefined" &&
    typeof window.Highlight !== "undefined" &&
    !!window.CSS?.highlights;

  useEffect(() => {
    if (!supportsHighlight) return;
    if (document.getElementById("tts-highlight-style")) return;
    const style = document.createElement("style");
    style.id = "tts-highlight-style";
    style.textContent = `::highlight(${HIGHLIGHT_NAME}){background-color:#bd0e0d;color:#fff;}`;
    document.head.appendChild(style);
  }, [supportsHighlight]);

  const previewBlock = scrub != null ? tts.segBlocks[scrub] : null;
  const activeBlock = previewBlock != null ? previewBlock : tts.currentBlock;

  // Resaltado de PÁRRAFO.
  useEffect(() => {
    const prev = activeElRef.current;
    if (prev) prev.classList.remove("tts-reading");
    const el = activeBlock != null ? elsRef.current[activeBlock] : null;
    if (el) {
      el.classList.add("tts-reading");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      activeElRef.current = el;
    } else {
      activeElRef.current = null;
    }
  }, [activeBlock]);

  // Resaltado de PALABRA (CSS Custom Highlight API).
  useEffect(() => {
    if (!supportsHighlight) return;
    const w = tts.word;
    const el = w ? elsRef.current[w.blockIndex] : null;
    if (!el) {
      window.CSS.highlights.delete(HIGHLIGHT_NAME);
      return;
    }
    const range = rangeForOffset(el, w.start, w.length);
    if (range) {
      window.CSS.highlights.set(HIGHLIGHT_NAME, new window.Highlight(range));
    }
  }, [tts.word, supportsHighlight]);

  useEffect(() => {
    return () => {
      if (activeElRef.current)
        activeElRef.current.classList.remove("tts-reading");
      if (typeof window !== "undefined" && window.CSS?.highlights) {
        window.CSS.highlights.delete(HIGHLIGHT_NAME);
      }
    };
  }, []);

  const start = () => {
    const els = collectTargets();
    elsRef.current = els;
    const blocks = els.length
      ? els.map((el) => el.textContent)
      : [title, subtitle, ...htmlToBlocks(content)].filter(Boolean);
    tts.play(blocks);
  };

  // Toggle desde la ShareBar: reproducir / pausar / reanudar.
  const toggle = () => {
    if (tts.isPlaying) {
      tts.pause();
    } else if (tts.isPaused) {
      tts.play(); // reanudar
    } else {
      start();
    }
  };

  const active = tts.isPlaying || tts.isPaused;

  const sliderValue = scrub != null ? scrub : tts.segIndex;
  const pct = tts.segTotal > 1 ? (sliderValue / (tts.segTotal - 1)) * 100 : 0;
  const commitSeek = () => {
    if (scrub != null) {
      tts.seek(scrub);
      setScrub(null);
    }
  };

  // Contenido del reproductor: se usa tanto en la barra inferior (mobile) como
  // en el popover que abre al hacer hover sobre el ícono de escucha (desktop).
  const controls = (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={tts.isPlaying ? tts.pause : toggle}
          aria-label={tts.isPlaying ? "Pause" : "Play"}
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 text-white bg-[#BD0E0D] hover:bg-[#9d0b0a] transition-colors"
        >
          {tts.isPlaying ? <FaPause size={13} /> : <FaPlay size={13} />}
        </button>
        <button
          onClick={tts.stop}
          aria-label="Stop"
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <FaStop size={12} />
        </button>
        <input
          type="range"
          min="0"
          max={Math.max(0, tts.segTotal - 1)}
          step="1"
          value={sliderValue}
          onChange={(e) => setScrub(parseInt(e.target.value, 10))}
          onMouseUp={commitSeek}
          onTouchEnd={commitSeek}
          onKeyUp={commitSeek}
          className="flex-1 accent-[#BD0E0D]"
          aria-label={isDE ? "Fortschritt" : "Progreso"}
        />
        <span className="shrink-0 w-12 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {Math.round(pct)}%
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          {isDE ? "Tempo" : "Velocidad"}
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={tts.rate}
            onChange={(e) => tts.setRate(parseFloat(e.target.value))}
          />
          <span className="w-8 tabular-nums">{tts.rate.toFixed(1)}×</span>
        </label>
        {tts.langVoices.length > 0 && (
          <select
            value={tts.voiceURI}
            onChange={(e) => tts.setVoiceURI(e.target.value)}
            className="rounded-none border border-gray-300 px-2 py-1 text-xs dark:bg-gray-800 dark:text-gray-100 max-w-[160px]"
          >
            {tts.langVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {voiceLabel(v)}
              </option>
            ))}
          </select>
        )}
      </div>
    </>
  );

  // En desktop los controles viven en el popover de la ShareBar (hover sobre el
  // ícono de escucha); la barra inferior flotante queda solo para mobile.
  const floatingBar =
    mounted && tts.supported && active
      ? createPortal(
          <div className="md:hidden fixed inset-x-0 bottom-0 z-[1000] flex justify-center px-3 pb-3 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-3xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-xl rounded-none px-4 py-3">
              {controls}
            </div>
          </div>,
          document.body
        )
      : null;

  const value = {
    canListen: canListen && tts.supported,
    isPlaying: tts.isPlaying,
    isPaused: tts.isPaused,
    active,
    toggle,
    stop: tts.stop,
    isDE,
    controls,
  };

  return (
    <ArticleListenContext.Provider value={value}>
      {children}
      {floatingBar}
    </ArticleListenContext.Provider>
  );
}

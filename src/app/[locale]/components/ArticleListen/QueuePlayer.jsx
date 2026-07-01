"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  FaPlay,
  FaPause,
  FaStop,
  FaStepBackward,
  FaStepForward,
  FaExpand,
  FaCompress,
} from "react-icons/fa";
import {
  useArticleTTS,
  htmlToBlocks,
  voiceLabel,
  rangeForOffset,
  CHARS_PER_SEC,
} from "./useArticleTTS";
import { speechFriendly } from "./speechFriendly";

function fmtTime(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fmtMonthYear(dateStr, lang) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(
      lang === "de" ? "de-DE" : "es-ES",
      { month: "long", year: "numeric" }
    );
  } catch {
    return "";
  }
}

// Preámbulo hablado antes del cuerpo de cada artículo:
// título · Dossier (mes año) · autores · tipo de Beitrag.
function preamble(a, lang) {
  const isES = lang === "es";
  const title = isES && a.titleES ? a.titleES : a.title;
  const subtitle = isES && a.subtitleES ? a.subtitleES : a.subtitle;
  const my = fmtMonthYear(a.edition?.datePublished, lang);
  const ednNumber = a.edition?.number;
  const ednTitle = a.edition?.title;
  const dossier =
    ednNumber && ednTitle
      ? `ila ${ednNumber}: ${ednTitle}`
      : ednTitle || (ednNumber ? `ila ${ednNumber}` : "");
  const authors = (a.authors || [])
    .map((x) => x.name)
    .filter(Boolean)
    .join(", ");
  const interviewees = (a.interviewees || [])
    .map((x) => x.name)
    .filter(Boolean)
    .join(", ");
  const isInterview = a.beitragstyp?.name?.toLowerCase() === "interview";
  const typ = isES
    ? a.beitragstyp?.nameES || a.beitragstyp?.name
    : a.beitragstyp?.name;
  const vorspann = stripHtml(
    isES && a.previewTextES ? a.previewTextES : a.previewText
  );
  const lines = [];
  if (title) lines.push(title);
  if (subtitle) lines.push(subtitle);
  if (dossier) {
    lines.push(
      isES
        ? `Del dossier ${dossier}${my ? `, ${my}` : ""}.`
        : `Aus dem Dossier ${dossier}${my ? `, ${my}` : ""}.`
    );
  }
  if (isInterview && interviewees) {
    if (authors) {
      lines.push(
        isES
          ? `Entrevista de ${authors} con ${interviewees}.`
          : `Interview von ${authors} mit ${interviewees}.`
      );
    } else {
      lines.push(
        isES ? `Entrevista con ${interviewees}.` : `Interview mit ${interviewees}.`
      );
    }
  } else if (authors) {
    lines.push(isES ? `Por ${authors}.` : `Von ${authors}.`);
  }
  if (typ) lines.push(typ);
  if (vorspann) lines.push(vorspann);
  return lines;
}

function bodyBlocks(a, lang) {
  const html =
    lang === "es" && a.isTranslatedES && a.contentES ? a.contentES : a.content;
  return htmlToBlocks(html);
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function primaryImageOf(a) {
  if (a?.images?.length) return a.images[0];
  if (a?.articleImage) return { url: a.articleImage, alt: "" };
  return null;
}

function buildQueue(articles, lang) {
  const blocks = [];
  const boundaries = [];
  articles.forEach((a) => {
    boundaries.push(blocks.length);
    preamble(a, lang).forEach((b) => blocks.push(b));
    bodyBlocks(a, lang).forEach((b) => blocks.push(b));
  });
  return { blocks, boundaries };
}

// Nombre del highlight de palabra propio del QueuePlayer (verde GLOBila), para
// no pisar el "tts-word" rojo de la página de artículo.
const HIGHLIGHT_NAME = "tts-word-q";

// Reproductor de cola: recibe una lista de IDs de artículos, fetchea su
// contenido y los lee de corrido con la Web Speech API. Usado en GLOBila y en
// la vista de Expediciones (dashboard de suscriptores).
export default function QueuePlayer({
  ids,
  initialLang = "de",
  onClose,
  accent = "#89B881",
}) {
  const [lang, setLang] = useState(initialLang);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const tts = useArticleTTS(lang);
  const isDE = lang === "de";
  const startedRef = useRef(false);

  // Key estable: el caller suele pasar un array nuevo en cada render
  // (`ids={[listenId]}`); sin esto el fetch se repetiría y reiniciaría el audio.
  const idsKey = ids?.join(",") || "";

  // Fetch del contenido completo por IDs (preserva el orden recibido).
  useEffect(() => {
    if (!idsKey) return;
    const idList = idsKey.split(",").map((n) => Number(n));
    let active = true;
    setLoading(true);
    fetch(`/api/articles/batch?ids=${idsKey}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const arr = Array.isArray(data) ? data : [];
        const byId = new Map(arr.map((a) => [a.id, a]));
        setArticles(idList.map((id) => byId.get(id)).filter(Boolean));
      })
      .catch(() => active && setArticles([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [idsKey]);

  const anyES = useMemo(
    () => articles.some((a) => a.isTranslatedES && a.contentES),
    [articles]
  );

  const { blocks, boundaries } = useMemo(
    () => buildQueue(articles, lang),
    [articles, lang]
  );

  const playQueue = () => tts.play(blocks, (t) => speechFriendly(t, lang));

  // Autoplay una vez cargado el contenido.
  useEffect(() => {
    if (loading || startedRef.current || !blocks.length || !tts.supported)
      return;
    startedRef.current = true;
    playQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, blocks, tts.supported]);

  // Cambio de idioma: reconstruye la cola y vuelve a empezar.
  const changeLang = (l) => {
    if (l === lang) return;
    tts.stop();
    startedRef.current = false;
    setLang(l);
  };

  // Índice del artículo en curso, derivado del bloque actual.
  const curIdx = useMemo(() => {
    const cb = tts.currentBlock;
    if (cb == null) return 0;
    let k = 0;
    for (let i = 0; i < boundaries.length; i++) {
      if (boundaries[i] <= cb) k = i;
      else break;
    }
    return k;
  }, [tts.currentBlock, boundaries]);

  const jumpToArticle = (k) => {
    const target = Math.max(0, Math.min(boundaries.length - 1, k));
    const seg = tts.segBlocks.findIndex((bi) => bi === boundaries[target]);
    if (seg >= 0) tts.seek(seg);
  };

  // Artículo en reproducción: datos para el "slide" tipo playlist.
  const cur = articles[curIdx];
  const curES = lang === "es" && cur?.isTranslatedES;
  const curTitle = cur ? (curES ? cur.titleES || cur.title : cur.title) : "";
  const curSubtitle = cur
    ? curES
      ? cur.subtitleES || cur.subtitle
      : cur.subtitle
    : "";
  const curVorspann = cur
    ? stripHtml(curES ? cur.previewTextES || cur.previewText : cur.previewText)
    : "";
  const curImg = primaryImageOf(cur);
  const curImages = cur?.images || [];
  const curNumber = cur?.edition?.number;
  const curDossier = cur?.edition?.title || "";

  // Progreso estimado del artículo en curso. La Web Speech API no da tiempo
  // real, así que se estima por caracteres a la misma velocidad de lectura
  // (CHARS_PER_SEC) que usa el hook para el resaltado.
  const articleChars = useMemo(
    () =>
      boundaries.map((startB, i) => {
        const endB = i + 1 < boundaries.length ? boundaries[i + 1] : blocks.length;
        let n = 0;
        for (let b = startB; b < endB; b++) n += (blocks[b] || "").length;
        return n;
      }),
    [boundaries, blocks]
  );

  const charsReadInArticle = useMemo(() => {
    const cb = tts.currentBlock;
    if (cb == null) return 0;
    const startB = boundaries[curIdx] ?? 0;
    let n = 0;
    for (let b = startB; b < cb; b++) n += (blocks[b] || "").length;
    if (tts.word && tts.word.blockIndex === cb) n += tts.word.start;
    return n;
  }, [tts.currentBlock, tts.word, boundaries, curIdx, blocks]);

  const totalChars = articleChars[curIdx] || 0;
  const cps = CHARS_PER_SEC * (tts.rate || 1);
  const totalSec = totalChars / cps;
  const elapsedSec = Math.min(totalSec, charsReadInArticle / cps);
  const remainingSec = Math.max(0, totalSec - elapsedSec);
  const progressPct = totalChars
    ? Math.min(100, (charsReadInArticle / totalChars) * 100)
    : 0;

  // Prefijo de caracteres acumulados por bloque (para mapear posición → bloque).
  const blockPrefix = useMemo(() => {
    const p = [0];
    for (let b = 0; b < blocks.length; b++) p.push(p[b] + (blocks[b] || "").length);
    return p;
  }, [blocks]);

  // Click en la barra: salta al segmento más cercano a esa posición de caracteres.
  const seekToFraction = (f) => {
    if (!totalChars || !tts.segMeta?.length) return;
    const startB = boundaries[curIdx] ?? 0;
    const endB =
      curIdx + 1 < boundaries.length ? boundaries[curIdx + 1] : blocks.length;
    const target = Math.max(0, Math.min(1, f)) * totalChars;
    const base = blockPrefix[startB] || 0;
    let best = -1;
    for (let i = 0; i < tts.segMeta.length; i++) {
      const m = tts.segMeta[i];
      if (m.blockIndex < startB || m.blockIndex >= endB) continue;
      const segAbs = (blockPrefix[m.blockIndex] || 0) - base + m.offset;
      if (best === -1) best = i; // primer segmento del artículo (fallback)
      if (segAbs <= target) best = i;
      else break;
    }
    if (best >= 0) tts.seek(best);
  };

  const onBarClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    seekToFraction((e.clientX - r.left) / r.width);
  };

  // --- Vista ampliada + seguimiento palabra por palabra ---
  const [expanded, setExpanded] = useState(false);
  const paraRefs = useRef([]);
  const activeParaRef = useRef(null);

  const supportsHighlight =
    typeof window !== "undefined" &&
    typeof window.Highlight !== "undefined" &&
    !!window.CSS?.highlights;

  // Bloques del artículo en curso (solo cuerpo + preámbulo de ese artículo).
  const startB = boundaries[curIdx] ?? 0;
  const endB =
    curIdx + 1 < boundaries.length ? boundaries[curIdx + 1] : blocks.length;
  const curBlocks = useMemo(
    () => blocks.slice(startB, endB),
    [blocks, startB, endB]
  );
  // Nº de bloques de preámbulo (título · meta) al inicio del artículo, para
  // diferenciar visualmente el título y la metainformación del cuerpo.
  const preLen = useMemo(
    () => (cur ? preamble(cur, lang).length : 0),
    [cur, lang]
  );

  // Inyecta en runtime el estilo del highlight de palabra (Turbopack no parsea
  // ::highlight() en el CSS) y la clase de párrafo activo, en verde GLOBila.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById("tts-q-highlight-style")) return;
    const style = document.createElement("style");
    style.id = "tts-q-highlight-style";
    style.textContent = `::highlight(${HIGHLIGHT_NAME}){background-color:#46663f;color:#fff;}.tts-q-reading{background-color:rgba(137,184,129,0.16);box-shadow:-4px 0 0 0 #557a4c;border-radius:2px;padding-left:0.75rem;transition:background-color .25s ease;scroll-margin-top:6rem;}`;
    document.head.appendChild(style);
  }, []);

  // Resaltado de PÁRRAFO en la vista ampliada.
  useEffect(() => {
    if (!expanded) return;
    const prev = activeParaRef.current;
    if (prev) prev.classList.remove("tts-q-reading");
    const local = tts.currentBlock != null ? tts.currentBlock - startB : -1;
    const el = local >= 0 ? paraRefs.current[local] : null;
    if (el) {
      el.classList.add("tts-q-reading");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      activeParaRef.current = el;
    } else {
      activeParaRef.current = null;
    }
  }, [expanded, tts.currentBlock, startB]);

  // Resaltado de PALABRA (CSS Custom Highlight API) en la vista ampliada.
  useEffect(() => {
    if (!supportsHighlight) return;
    if (!expanded) {
      window.CSS.highlights.delete(HIGHLIGHT_NAME);
      return;
    }
    const w = tts.word;
    const local = w ? w.blockIndex - startB : -1;
    const el = local >= 0 ? paraRefs.current[local] : null;
    if (!el) {
      window.CSS.highlights.delete(HIGHLIGHT_NAME);
      return;
    }
    const range = rangeForOffset(el, w.start, w.length);
    if (range) {
      window.CSS.highlights.set(HIGHLIGHT_NAME, new window.Highlight(range));
    }
  }, [expanded, supportsHighlight, tts.word, startB]);

  // Limpieza al desmontar.
  useEffect(() => {
    return () => {
      if (activeParaRef.current)
        activeParaRef.current.classList.remove("tts-q-reading");
      if (typeof window !== "undefined" && window.CSS?.highlights) {
        window.CSS.highlights.delete(HIGHLIGHT_NAME);
      }
    };
  }, []);

  const handleClose = () => {
    tts.stop();
    setExpanded(false);
    onClose?.();
  };

  const progressRow =
    !loading && cur && tts.supported && totalChars > 0 ? (
      <div className="mb-3">
        <div
          role="slider"
          aria-label={isDE ? "Fortschritt" : "Progreso"}
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onClick={onBarClick}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") seekToFraction(progressPct / 100 + 0.05);
            if (e.key === "ArrowLeft") seekToFraction(progressPct / 100 - 0.05);
          }}
          className="group relative -my-1.5 cursor-pointer py-1.5"
        >
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-[width] duration-200"
              style={{ width: `${progressPct}%`, backgroundColor: accent }}
            />
          </div>
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100"
            style={{ left: `${progressPct}%`, backgroundColor: accent }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-gray-500">
          <span>{fmtTime(elapsedSec)}</span>
          <span>-{fmtTime(remainingSec)}</span>
        </div>
      </div>
    ) : null;

  const controlsRow = !tts.supported ? (
    <p className="text-xs text-yellow-700">
      {isDE
        ? "Dein Browser unterstützt keine Sprachausgabe."
        : "Tu navegador no soporta síntesis de voz."}
    </p>
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      {boundaries.length > 1 && (
        <button
          onClick={() => jumpToArticle(curIdx - 1)}
          disabled={loading || curIdx <= 0}
          className="rounded-full border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          aria-label="Prev"
        >
          <FaStepBackward size={11} />
        </button>
      )}

      {!tts.isPlaying ? (
        <button
          onClick={playQueue}
          disabled={loading || !blocks.length}
          className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          <FaPlay size={11} />{" "}
          {tts.isPaused ? (isDE ? "Weiter" : "Seguir") : "Play"}
        </button>
      ) : (
        <button
          onClick={tts.pause}
          className="flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700"
        >
          <FaPause size={11} /> {isDE ? "Pause" : "Pausa"}
        </button>
      )}

      {boundaries.length > 1 && (
        <button
          onClick={() => jumpToArticle(curIdx + 1)}
          disabled={loading || curIdx >= boundaries.length - 1}
          className="rounded-full border border-gray-300 p-2 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          aria-label="Next"
        >
          <FaStepForward size={11} />
        </button>
      )}

      <button
        onClick={handleClose}
        className="flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <FaStop size={11} /> Stop
      </button>

      {/* Idioma (solo si hay traducción ES disponible) */}
      {anyES && (
        <div className="flex items-center gap-1">
          {["de", "es"].map((l) => (
            <button
              key={l}
              onClick={() => changeLang(l)}
              className={`rounded-none px-2 py-1 text-xs font-semibold uppercase ${
                lang === l
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={lang === l ? { backgroundColor: accent } : undefined}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Velocidad */}
      <label className="flex items-center gap-2 text-xs text-gray-600">
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

      {/* Voz */}
      {tts.langVoices.length > 0 && (
        <select
          value={tts.voiceURI}
          onChange={(e) => tts.setVoiceURI(e.target.value)}
          className="rounded-none border border-gray-300 px-2 py-1 text-xs"
        >
          {tts.langVoices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {voiceLabel(v)}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  const bar = (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3">
      <div
        className="w-full max-w-2xl border bg-white shadow-xl"
        style={{ borderColor: accent }}
      >
        {/* Barra de título: qué suena */}
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: accent }}
        >
          <span>🎧 GLOBila</span>
          {boundaries.length > 1 && (
            <span className="opacity-90">
              {curIdx + 1} / {boundaries.length}
            </span>
          )}
          <button
            onClick={() => setExpanded(true)}
            disabled={loading || !cur}
            className="ml-auto inline-flex items-center text-white/90 hover:text-white disabled:opacity-40"
            aria-label={isDE ? "Vergrößern" : "Ampliar"}
            title={isDE ? "Vergrößern" : "Ampliar"}
          >
            <FaExpand size={12} />
          </button>
          <button
            onClick={handleClose}
            className="text-white/90 hover:text-white"
            aria-label="Stop"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3">
          {loading ? (
            <p className="mb-2 text-sm font-semibold text-gray-900">
              {isDE ? "Wird geladen…" : "Cargando…"}
            </p>
          ) : cur ? (
            <div className="mb-3">
              <div className="flex gap-3">
                {curImg?.url && (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-gray-200 sm:h-24 sm:w-24">
                    <Image
                      src={curImg.url}
                      alt={curImg.alt || curTitle}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {(curNumber || curDossier) && (
                    <p
                      className="mb-0.5 line-clamp-1 text-[11px] font-bold uppercase tracking-wide"
                      style={{ color: accent }}
                    >
                      {curNumber ? `№ ${curNumber}` : ""}
                      {curNumber && curDossier ? " · " : ""}
                      {curDossier}
                    </p>
                  )}
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                    {curTitle}
                  </p>
                  {curSubtitle && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                      {curSubtitle}
                    </p>
                  )}
                  {curVorspann && (
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-gray-500">
                      {curVorspann}
                    </p>
                  )}
                </div>
              </div>

              {curImages.length > 1 && (
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                  {curImages.map((im) => (
                    <div
                      key={im.id}
                      className="relative h-12 w-16 shrink-0 overflow-hidden border border-gray-200"
                    >
                      <Image
                        src={im.url}
                        alt={im.alt || ""}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mb-2 text-sm font-semibold text-gray-900">
              {isDE ? "Keine Artikel" : "Sin artículos"}
            </p>
          )}

          {progressRow}

          {controlsRow}
        </div>
      </div>
    </div>
  );

  // Vista ampliada: el cuerpo del artículo en curso con seguimiento palabra a
  // palabra (mismo motor que el "Escuchar" de la página de artículo).
  const overlay = expanded ? (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      <div
        className="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white sm:px-6"
        style={{ backgroundColor: accent }}
      >
        <span>🎧 GLOBila</span>
        {boundaries.length > 1 && (
          <span className="opacity-90">
            {curIdx + 1} / {boundaries.length}
          </span>
        )}
        <button
          onClick={() => setExpanded(false)}
          className="ml-auto inline-flex items-center gap-1 text-white/90 hover:text-white"
          aria-label={isDE ? "Verkleinern" : "Reducir"}
        >
          <FaCompress size={12} />
        </button>
        <button
          onClick={handleClose}
          className="text-white/90 hover:text-white"
          aria-label="Stop"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {(curNumber || curDossier) && (
            <p
              className="mb-3 text-xs font-bold uppercase tracking-wide"
              style={{ color: accent }}
            >
              {curNumber ? `№ ${curNumber}` : ""}
              {curNumber && curDossier ? " · " : ""}
              {curDossier}
            </p>
          )}
          {curImg?.url && (
            <div className="relative mb-5 aspect-[16/9] w-full overflow-hidden border border-gray-200">
              <Image
                src={curImg.url}
                alt={curImg.alt || curTitle}
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
              />
            </div>
          )}
          <div className="space-y-3 text-[17px] leading-relaxed text-gray-800">
            {curBlocks.map((text, i) => {
              const isTitle = i === 0;
              const isMeta = i > 0 && i < preLen;
              const cls = isTitle
                ? "text-2xl font-bold leading-tight text-gray-900"
                : isMeta
                  ? "text-sm text-gray-500"
                  : "";
              return (
                <p
                  key={i}
                  ref={(el) => {
                    paraRefs.current[i] = el;
                  }}
                  className={cls}
                >
                  {text}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {progressRow}
          {controlsRow}
        </div>
      </div>
    </div>
  ) : null;

  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      {!expanded && bar}
      {overlay}
    </>,
    document.body
  );
}

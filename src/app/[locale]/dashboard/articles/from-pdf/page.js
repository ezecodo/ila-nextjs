"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { extractArticleText } from "@/lib/pdfExtract";
import CheckboxField from "../../../components/Articles/NewArticle/CheckboxField";

// El publilab (InterviewEditor) usa el DOM; igual que en ArticleFormV2 se carga
// sin SSR.
const InterviewEditor = dynamic(
  () => import("../../../components/InterviewEditor/InterviewEditor"),
  { ssr: false }
);
// react-select async (igual que ArticleFormV2) para Regionen/Themen con
// búsqueda + crear-al-vuelo.
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

// Carga pdfjs desde CDN (mismo patrón que PdfReader).
function loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("SSR");
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Limpia el texto seleccionado: de-guionado + drop-cap + juntar saltos.
function cleanSelection(raw) {
  if (!raw) return "";
  return raw
    // De-guionado de fin de línea (alemán): "Wort-\nwort" → "Wortwort".
    .replace(/([A-Za-zÄÖÜäöüß])-\s*\n\s*([a-zäöüß])/g, "$1$2")
    // Drop-cap / Initiale: una mayúscula suelta + minúscula → misma palabra.
    .replace(/(^|[\s\n])([A-ZÄÖÜ])[\s\n]+(?=[a-zäöüß])/g, "$1$2")
    .replace(/\s*\n\s*/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// Línea de crédito (autor/foto) que se cuela al seleccionar el cuerpo.
const BYLINE_RE = /^(von|text|fotos?|bilder?|grafik|illustration|interview)[:\s]/i;

// Descarta líneas de crédito al principio de una selección de cuerpo.
function stripLeadingBylines(raw) {
  if (!raw) return "";
  const lines = raw.split(/\n/);
  while (lines.length) {
    const t = lines[0].trim();
    if (t === "" || (t.length <= 60 && BYLINE_RE.test(t))) lines.shift();
    else break;
  }
  return lines.join("\n");
}

// Heurística del Publilab: ¿parece un entretítulo? (corto, sin punto final).
function isHeadingLike(text) {
  if (!text || text.length > 140) return false;
  if (!/^[""'(\[]?[A-ZÄÖÜÑÁÉÍÓÚ¿]/.test(text)) return false;
  if (/:\s*$/.test(text)) return true;
  const endsWithSentence = /[a-z][.!?]\s*$/.test(text);
  const fewSentences = (text.match(/[a-z][.!?]/g) || []).length <= 1;
  return !endsWithSentence && fewSentences;
}

// Prepara una selección de cuerpo: descarta créditos, conserva los párrafos
// (líneas en blanco de la fuente) y marca entretítulos.
function reflowBodySelection(raw) {
  return stripLeadingBylines(raw)
    .split(/\n[ \t]*\n+/)
    .map((p) => cleanSelection(p))
    .filter(Boolean)
    .map((p) => {
      if (/^##\s/.test(p)) return p; // ya marcado por fuente/geometría
      return isHeadingLike(p) ? "## " + p : p;
    })
    .join("\n\n");
}

// Reconstruye los párrafos de la selección por GEOMETRÍA: agrupa los spans de
// los text-layers en líneas y corta párrafo cuando una línea queda corta (final
// de párrafo en texto justificado). Devuelve párrafos separados por "\n\n".
// Recolecta spans de TODOS los text-layers (la selección puede cruzar páginas
// en el visor continuo); como las páginas se apilan en vertical, ordenar por Y
// encadena las páginas en el orden de lectura.
function getSelectionParagraphs() {
  if (typeof window === "undefined") return "";
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return "";
  const range = sel.getRangeAt(0);

  const spans = Array.from(
    document.querySelectorAll(".pdfsel-textLayer span")
  ).filter(
    (s) => s.textContent && s.textContent.trim() && range.intersectsNode(s)
  );
  if (!spans.length) return "";

  const items = spans.map((s) => {
    const r = s.getBoundingClientRect();
    return {
      str: s.textContent,
      x: r.left,
      right: r.right,
      y: r.top,
      h: r.height,
      font: s.style.fontFamily || "",
    };
  });
  if (!items.length) return "";
  items.sort((a, b) => a.y - b.y || a.x - b.x);

  // Fuente dominante del cuerpo (ponderada por nº de caracteres). Los
  // entretítulos en negrita usan otra fontFamily → así se detectan.
  const fontWeight = {};
  for (const it of items) {
    if (it.font) fontWeight[it.font] = (fontWeight[it.font] || 0) + it.str.length;
  }
  let domFont = "";
  let domBest = 0;
  for (const f in fontWeight) {
    if (fontWeight[f] > domBest) {
      domBest = fontWeight[f];
      domFont = f;
    }
  }

  // Agrupar en líneas por baseline (Y).
  const lines = [];
  let cur = null;
  for (const it of items) {
    if (cur && Math.abs(it.y - cur.y) <= 6) {
      cur.items.push(it);
      cur.right = Math.max(cur.right, it.right);
      cur.left = Math.min(cur.left, it.x);
      cur.h = Math.max(cur.h, it.h);
    } else {
      cur = { y: it.y, left: it.x, right: it.right, h: it.h, items: [it] };
      lines.push(cur);
    }
  }
  // Texto + fuente dominante de cada línea.
  for (const l of lines) {
    l.items.sort((a, b) => a.x - b.x);
    let text = "";
    let lastRight = null;
    const lf = {};
    for (const it of l.items) {
      if (
        text &&
        lastRight !== null &&
        !/\s$/.test(text) &&
        !/^\s/.test(it.str) &&
        it.x - lastRight > l.h * 0.2
      ) {
        text += " ";
      }
      text += it.str;
      lastRight = it.right;
      if (it.font) lf[it.font] = (lf[it.font] || 0) + it.str.length;
    }
    l.text = text.replace(/\s+/g, " ").trim();
    let lBest = 0;
    let lFont = "";
    for (const f in lf) {
      if (lf[f] > lBest) {
        lBest = lf[f];
        lFont = f;
      }
    }
    l.font = lFont;
  }
  const ls = lines.filter((l) => l.text);
  if (!ls.length) return "";

  const colRight = Math.max(...ls.map((l) => l.right));
  const colLeft = Math.min(...ls.map((l) => l.left));
  const shortThreshold = (colRight - colLeft) * 0.06 + 4;
  const sortedH = ls.map((l) => l.h).sort((a, b) => a - b);
  const medH = sortedH[Math.floor(sortedH.length / 2)] || 0;

  // ¿Entretítulo? Mismas reglas que pdfExtract.isHeadingLine: fuente distinta
  // a la del cuerpo (negrita) → entretítulo; o más alto que el cuerpo y corto.
  const isHeading = (l) => {
    const text = l.text;
    if (text.length < 3 || text.length > 110) return false;
    if (!/^["'(\[«¿¡]?[A-ZÄÖÜÑÁÉÍÓÚ0-9]/.test(text)) return false;
    if (/[.!]["')\]]?\s*$/.test(text)) return false;
    if (domFont && l.font && l.font !== domFont) return true;
    const isShort = l.right < colRight - (colRight - colLeft) * 0.1;
    const tall = medH && l.h >= medH * 1.18;
    return tall && isShort;
  };

  const paras = [];
  let buf = "";
  let head = ""; // entretítulo en curso (puede ocupar varias líneas)
  const flushBuf = () => {
    if (buf.trim()) paras.push(buf.trim());
    buf = "";
  };
  const flushHead = () => {
    if (head.trim()) paras.push("## " + head.trim());
    head = "";
  };
  for (let i = 0; i < ls.length; i++) {
    const l = ls[i];
    if (isHeading(l)) {
      flushBuf();
      head = head ? head + " " + l.text : l.text;
      continue;
    }
    flushHead();
    if (!buf) buf = l.text;
    else if (/[A-Za-zÄÖÜäöüß]-$/.test(buf) && /^[a-zäöüß]/.test(l.text))
      buf = buf.replace(/-$/, "") + l.text; // de-guionado
    else buf += " " + l.text;
    if (l.right < colRight - shortThreshold) flushBuf();
  }
  flushHead();
  flushBuf();
  return paras.filter(Boolean).join("\n\n");
}

// Aplana un árbol de regiones/temas a opciones { value, label } con etiqueta
// jerárquica ("Padre > Hijo"), igual que ArticleFormV2.
function flattenTreeOptions(nodes, parentName = "") {
  const options = [];
  for (const node of nodes || []) {
    const label = parentName ? `${parentName} > ${node.name}` : node.name;
    options.push({ value: node.id, label });
    if (node.children?.length)
      options.push(...flattenTreeOptions(node.children, label));
  }
  return options;
}

// Ordena opciones por relevancia frente a la búsqueda: exactas → empiezan → contienen.
function rankOptions(flat, query) {
  const norm = (s) => (s || "").trim().toLowerCase();
  const nq = norm(query);
  if (!nq) return flat;
  const exact = flat.filter((o) => norm(o.label) === nq);
  const starts = flat.filter(
    (o) => norm(o.label).startsWith(nq) && norm(o.label) !== nq
  );
  const includes = flat.filter(
    (o) => norm(o.label).includes(nq) && !norm(o.label).startsWith(nq)
  );
  return [...exact, ...starts, ...includes];
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Coste en USD (lo que cobra Anthropic). Importes minúsculos → muestra céntimos
// de dólar cuando es < 1 ¢.
function fmtUsd(c) {
  if (c == null) return "–";
  return c < 0.01 ? `${(c * 100).toFixed(3)}¢` : `$${c.toFixed(4)}`;
}

// Convierte el cuerpo al HTML del artículo. Línea en blanco = nuevo párrafo
// (<p>), salto de línea simple = <br>, líneas "## " = entretítulo (<h3>/<h4>).
// Se procesa LÍNEA por LÍNEA: una línea con "## " titula SÓLO esa línea; el
// texto que la sigue (aunque vaya pegado, con salto simple) queda como párrafo
// aparte y no hereda el formato de título.
function bodyTextToHtml(text) {
  if (!text || !text.trim()) return "";
  const out = [];
  let para = [];
  const flushPara = () => {
    const inner = para
      .map((l) => escapeHtml(l.trim()))
      .filter(Boolean)
      .join("<br>");
    if (inner) out.push(`<p>${inner}</p>`);
    para = [];
  };
  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.replace(/[ \t]+$/g, "");
    const heading = line.match(/^#{2,3}\s+(.+)$/);
    if (heading) {
      flushPara();
      const inner = escapeHtml(heading[1].replace(/\s+/g, " ").trim());
      // El Publilab (InterviewEditor) genera los Zwischentitel siempre como
      // <h3>; replicamos ese formato canónico para que se vean igual.
      out.push(`<h3>${inner}</h3>`);
    } else if (line.trim() === "") {
      flushPara();
    } else {
      para.push(line);
    }
  }
  flushPara();
  return out.join("\n");
}

// Recorta una región de una página del PDF a un JPEG. Las esquinas vienen en
// coords PDF a escala 1, origen abajo-izquierda (igual que las anclas). Re-renderiza
// la página a alta resolución (`scale`) para que el recorte salga nítido.
async function cropPdfRegion(pdfDoc, pageNumber, a, b, scale = 3) {
  const page = await pdfDoc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale });
  const full = document.createElement("canvas");
  full.width = Math.ceil(viewport.width);
  full.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: full.getContext("2d"), viewport }).promise;

  const left = Math.min(a.x, b.x) * scale;
  const right = Math.max(a.x, b.x) * scale;
  const top = (base.height - Math.max(a.y, b.y)) * scale; // y abajo-izq → top-izq
  const bottom = (base.height - Math.min(a.y, b.y)) * scale;
  const w = Math.max(1, Math.round(right - left));
  const h = Math.max(1, Math.round(bottom - top));

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d").drawImage(full, left, top, w, h, 0, 0, w, h);
  return new Promise((resolve) =>
    out.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
  );
}

// ── Vista de una página: canvas + text-layer de pdfjs (selección nativa) ───
// El texto se selecciona arrastrando, como cualquier texto. En modo recorte de
// imagen (`cropMode`) el text-layer no captura el ratón y se dibuja un rectángulo
// arrastrando (rubber-band): al soltar se recortan ambas esquinas (coords PDF a
// escala 1, origen abajo-izquierda).
//
// Render LAZY: todas las páginas del PDF están en el DOM, pero el canvas +
// text-layer sólo se renderizan cuando la página está cerca del viewport
// (IntersectionObserver con `rootRef` como root). Al alejarse se libera la
// memoria y queda un placeholder con la altura estimada (`aspect`). Así se puede
// scrollear un dossier entero sin reventar la memoria del navegador.
function PdfPageView({ pdfDoc, pageNumber, pdfjs, width, cropMode, onCrop, aspect, rootRef }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderRef = useRef(null);
  const taskRef = useRef(null);
  const [dims, setDims] = useState(null); // { scale, pageHeight } a escala 1
  const [visible, setVisible] = useState(false);
  // Rectángulo de arrastre en px relativos al canvas: { x0, y0, x1, y1 }.
  const [drag, setDrag] = useState(null);

  // Renderiza cuando la página entra (o se acerca) al viewport; libera al salir.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: rootRef?.current || null, rootMargin: "1500px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootRef]);

  useEffect(() => {
    if (!visible || !pdfDoc || !pdfjs || !canvasRef.current || !textLayerRef.current)
      return;
    let cancelled = false;

    pdfDoc.getPage(pageNumber).then(async (page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      const viewport = page.getViewport({ scale });
      const pixelRatio = window.devicePixelRatio || 1;

      const canvas = canvasRef.current;
      const renderViewport = page.getViewport({ scale: scale * pixelRatio });
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      if (renderRef.current) renderRef.current.cancel?.();
      renderRef.current = page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: renderViewport,
      });

      const textLayer = textLayerRef.current;
      textLayer.innerHTML = "";
      textLayer.style.width = viewport.width + "px";
      textLayer.style.height = viewport.height + "px";
      textLayer.style.setProperty("--scale-factor", String(scale));

      setDims({ scale, pageHeight: base.height });

      const textContent = await page.getTextContent();
      if (cancelled) return;
      if (taskRef.current) taskRef.current.cancel?.();
      taskRef.current = pdfjs.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport,
      });
    });

    return () => {
      cancelled = true;
      if (renderRef.current) renderRef.current.cancel?.();
      if (taskRef.current) taskRef.current.cancel?.();
    };
  }, [visible, pdfDoc, pdfjs, pageNumber, width]);

  // Punto px relativo al canvas a partir de un evento de ratón.
  const localPx = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDragStart = (e) => {
    if (!cropMode || !dims || !canvasRef.current) return;
    e.preventDefault();
    const { x, y } = localPx(e);
    setDrag({ x0: x, y0: y, x1: x, y1: y });
  };

  const onDragMove = (e) => {
    if (!drag) return;
    const { x, y } = localPx(e);
    setDrag((d) => (d ? { ...d, x1: x, y1: y } : d));
  };

  const onDragEnd = () => {
    if (!drag || !dims) {
      setDrag(null);
      return;
    }
    const left = Math.min(drag.x0, drag.x1);
    const right = Math.max(drag.x0, drag.x1);
    const top = Math.min(drag.y0, drag.y1);
    const bottom = Math.max(drag.y0, drag.y1);
    setDrag(null);
    // Ignora arrastres minúsculos (clicks accidentales).
    if (right - left < 8 || bottom - top < 8) return;
    // px (top-izq) → coords PDF a escala 1, origen abajo-izquierda.
    const toPdf = (px, py) => ({
      page: pageNumber,
      x: px / dims.scale,
      y: dims.pageHeight - py / dims.scale,
    });
    onCrop?.(toPdf(left, top), toPdf(right, bottom));
  };

  // Altura del placeholder mientras no está renderizada (ratio de la pág. 1).
  const placeholderHeight = width * (aspect || 1.414);

  const dragRect = drag
    ? {
        left: Math.min(drag.x0, drag.x1),
        top: Math.min(drag.y0, drag.y1),
        width: Math.abs(drag.x1 - drag.x0),
        height: Math.abs(drag.y1 - drag.y0),
      }
    : null;

  return (
    <div ref={wrapRef} data-page={pageNumber} style={{ width }}>
      {visible ? (
        <div
          className="relative mx-auto"
          style={{ width, cursor: cropMode ? "crosshair" : "auto" }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          onMouseLeave={() => setDrag(null)}
        >
          <canvas ref={canvasRef} className="block bg-white shadow-lg" />
          <div
            ref={textLayerRef}
            className="pdfsel-textLayer absolute top-0 left-0"
            style={{
              lineHeight: 1,
              pointerEvents: cropMode ? "none" : "auto",
            }}
          />
          {dragRect && (
            <div
              className="absolute border-2 border-blue-600 bg-blue-500/20 pointer-events-none"
              style={{
                left: dragRect.left,
                top: dragRect.top,
                width: dragRect.width,
                height: dragRect.height,
              }}
            />
          )}
        </div>
      ) : (
        <div
          className="mx-auto bg-white shadow-lg flex items-center justify-center text-gray-300 text-xs"
          style={{ width, height: placeholderHeight }}
        >
          Seite {pageNumber}
        </div>
      )}
    </div>
  );
}

// Campo de texto con botón "tomar selección del PDF".
function PdfField({ label, value, onChange, onTake, multiline, required }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">
          {label} {required && <span className="text-[#BD0E0D]">*</span>}
        </label>
        <button
          type="button"
          onClick={onTake}
          className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          title="Aktuelle PDF-Auswahl übernehmen"
        >
          ← Auswahl
        </button>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
          rows={3}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
        />
      )}
    </div>
  );
}

export default function FromPdfPage() {
  const [pdfjs, setPdfjs] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [fileName, setFileName] = useState("");
  // Visor continuo: TODAS las páginas viven en el DOM, render lazy según el
  // viewport. `pageAspect` (alto/ancho de la pág. 1) reserva la altura de los
  // placeholders. Refs a los contenedores con scroll para el IntersectionObserver.
  const [pageAspect, setPageAspect] = useState(1.414);
  const scrollRef = useRef(null);
  const fsScrollRef = useRef(null);
  const [pageWidth, setPageWidth] = useState(620);
  const [loading, setLoading] = useState(false);

  // Selección actual del PDF.
  const lastSelectionRef = useRef("");
  const bodyParasRef = useRef(""); // párrafos reconstruidos por geometría
  const [selectionPreview, setSelectionPreview] = useState("");

  // Campos del artículo.
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [content, setContent] = useState("");

  // Publilab (InterviewEditor) como editor del Fließtext. Cuando está activo, el
  // cuerpo se edita en HTML dentro del publilab y `contentHtml` es la fuente de
  // verdad para guardar. `publilabKey` fuerza el remount para re-sembrar (p. ej.
  // tras una nueva extracción de Claude). Mientras está inactivo, se usa el
  // textarea con `content` (texto + "## ").
  const [publilabOn, setPublilabOn] = useState(false);
  const [contentHtml, setContentHtml] = useState("");
  const [publilabKey, setPublilabKey] = useState(0);

  // Relaciones / catálogos.
  const [editions, setEditions] = useState([]);
  const [editionId, setEditionId] = useState("");
  const [beitragstypen, setBeitragstypen] = useState([]);
  const [beitragstypId, setBeitragstypId] = useState("");
  const [beitragssubtypId, setBeitragssubtypId] = useState("");
  const [categories, setCategories] = useState([]);
  // Mismo patrón que ArticleFormV2: Kategorien como array de IDs (checkboxes),
  // Regionen/Themen como [{ value, label }] (react-select async).
  const [selCategories, setSelCategories] = useState([]);
  const [selRegions, setSelRegions] = useState([]);
  const [selTopics, setSelTopics] = useState([]);

  // Autores.
  const [authorsCache, setAuthorsCache] = useState([]);
  const [selAuthors, setSelAuthors] = useState([]);
  const [authorBusy, setAuthorBusy] = useState(false);

  // Rango de páginas del cuerpo.
  const [bodyFrom, setBodyFrom] = useState("");
  const [bodyTo, setBodyTo] = useState("");
  const [bodyBusy, setBodyBusy] = useState(false);

  // Estructuración con Claude (API). Mide tokens/coste por llamada y acumulado.
  const [aiModel, setAiModel] = useState("claude-haiku-4-5-20251001");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiUsage, setAiUsage] = useState(null); // último: {input_tokens, output_tokens, cost, model}
  const [aiTotalCost, setAiTotalCost] = useState(0);
  const [aiTotalTokens, setAiTotalTokens] = useState({ input: 0, output: 0 });
  const [aiCalls, setAiCalls] = useState(0);
  const [aiBoundaryNote, setAiBoundaryNote] = useState("");

  // Recorte de imágenes del PDF (dos esquinas → JPEG → galería).
  const [cropMode, setCropMode] = useState(false); // arrastrar para recortar
  const [images, setImages] = useState([]); // { id, file, url, page, title, alt }
  const [cropBusy, setCropBusy] = useState(false);

  // Editor de cuerpo a pantalla completa (PDF | artículo).
  const [bodyFullscreen, setBodyFullscreen] = useState(false);
  const [bodyPreview, setBodyPreview] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [error, setError] = useState(null);

  // Carga pdfjs y catálogos al montar.
  useEffect(() => {
    loadPdfJs().then(setPdfjs).catch(() => setError("pdfjs konnte nicht geladen werden."));
    fetch("/api/beitragstypen").then((r) => r.json()).then(setBeitragstypen).catch(() => {});
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {});
    fetch("/api/authors").then((r) => r.json()).then((d) => setAuthorsCache(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/editions?admin=true&limit=500&page=1")
      .then((r) => r.json())
      .then((d) => setEditions(d.items || (Array.isArray(d) ? d : [])))
      .catch(() => {});
  }, []);

  // Captura la selección nativa del usuario sobre el text layer.
  useEffect(() => {
    const onSelChange = () => {
      const sel = window.getSelection();
      const text = sel ? sel.toString() : "";
      if (text && text.trim()) {
        const node = sel.anchorNode;
        const el = node?.nodeType === 3 ? node.parentElement : node;
        if (el && el.closest(".pdfsel-textLayer")) {
          lastSelectionRef.current = text;
          bodyParasRef.current = getSelectionParagraphs();
          setSelectionPreview(cleanSelection(text).slice(0, 140));
        }
      }
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
  }, []);

  // Esc cierra el modo pantalla completa del cuerpo.
  useEffect(() => {
    if (!bodyFullscreen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setBodyFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bodyFullscreen]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !pdfjs) return;
    setError(null);
    setLoading(true);
    setFileName(file.name);
    // Nuevo dossier → reinicia el contador de tokens/coste.
    setAiUsage(null);
    setAiTotalCost(0);
    setAiTotalTokens({ input: 0, output: 0 });
    setAiCalls(0);
    // Nuevo dossier → cierra el publilab y limpia su HTML.
    setPublilabOn(false);
    setContentHtml("");
    try {
      const buffer = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buffer }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      try {
        const page1 = await doc.getPage(1);
        const vp = page1.getViewport({ scale: 1 });
        setPageAspect(vp.height / vp.width);
      } catch {
        setPageAspect(1.414);
      }
    } catch (err) {
      console.error("PDF load error:", err);
      setError("Das PDF konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  const takeInto = (setter) => () => {
    const clean = cleanSelection(lastSelectionRef.current);
    if (clean) setter(clean);
  };

  // Añade la selección al final del cuerpo, conservando párrafos y marcando
  // entretítulos. Descarta créditos de autor/foto del principio.
  const appendBody = () => {
    const chunk = reflowBodySelection(bodyParasRef.current || lastSelectionRef.current);
    if (!chunk) return;
    setContent((prev) => (prev.trim() ? prev.replace(/\s+$/, "") + "\n\n" + chunk : chunk));
  };

  // Abre el publilab sembrándolo con el cuerpo actual convertido a HTML. A
  // partir de ahí `contentHtml` es la fuente de verdad. El remount (key) asegura
  // re-sembrar aunque el editor ya estuviera montado.
  const openPublilab = () => {
    setContentHtml(bodyTextToHtml(content));
    setPublilabKey((k) => k + 1);
    setPublilabOn(true);
  };

  // Añade la selección como entretítulo (marca "## " → <h3> al guardar).
  const appendHeading = () => {
    const clean = cleanSelection(lastSelectionRef.current);
    if (!clean) return;
    const heading = "## " + clean;
    setContent((prev) =>
      prev.trim() ? prev.replace(/\s+$/, "") + "\n\n" + heading : heading
    );
  };

  // Añade un autor por nombre (lo crea si no existe). Reutilizable: lo usan
  // tanto el botón "← Auswahl" como la estructuración con Claude.
  const addAuthorByName = useCallback(
    async (rawName) => {
      const name = (rawName || "").trim();
      if (!name) return;
      setAuthorBusy(true);
      try {
        const existing = authorsCache.find(
          (a) => a.name.toLowerCase() === name.toLowerCase()
        );
        let author = existing;
        if (!author) {
          const res = await fetch("/api/authors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (!res.ok) throw new Error("create author failed");
          author = await res.json();
          setAuthorsCache((prev) => [...prev, author]);
        }
        setSelAuthors((prev) =>
          prev.some((a) => a.id === author.id) ? prev : [...prev, author]
        );
      } catch (err) {
        console.error(err);
        setError("Autor konnte nicht angelegt werden.");
      } finally {
        setAuthorBusy(false);
      }
    },
    [authorsCache]
  );

  const takeAuthor = useCallback(
    () => addAuthorByName(cleanSelection(lastSelectionRef.current)),
    [addAuthorByName]
  );

  // ── Klassifizierung (mismo comportamiento que ArticleFormV2) ──────────────
  const toggleCategory = (categoryId) => {
    setSelCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const loadRegions = async (inputValue) => {
    try {
      const res = await fetch("/api/regions");
      if (!res.ok) return [];
      const flat = flattenTreeOptions(await res.json());
      const q = (inputValue || "").trim();
      return q ? rankOptions(flat, q) : flat.slice(0, 50);
    } catch {
      return [];
    }
  };

  const loadTopics = async (inputValue) => {
    const q = (inputValue || "").trim();
    if (!q) return [];
    try {
      const res = await fetch(`/api/topics?search=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const flat = flattenTreeOptions(await res.json());
      const ranked = rankOptions(flat, q);
      const norm = (s) => (s || "").trim().toLowerCase();
      const hasExact = flat.some((o) => norm(o.label) === norm(q));
      const maybeCreate = hasExact
        ? []
        : [{ value: "new", label: `➕ Neu anlegen: "${q}"`, __inputValue: q }];
      return [...maybeCreate, ...ranked];
    } catch {
      return [];
    }
  };

  const handleRegionChange = async (selectedOptions) => {
    const last = selectedOptions?.[selectedOptions.length - 1];
    if (last?.value === "new") {
      const rawName = last.__inputValue || last.label;
      try {
        const res = await fetch("/api/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rawName }),
        });
        if (res.ok) {
          const created = await res.json();
          setSelRegions([
            ...selectedOptions.slice(0, -1),
            { value: created.id, label: created.name },
          ]);
          return;
        }
      } catch {}
      setSelRegions(selectedOptions.slice(0, -1));
    } else {
      setSelRegions(selectedOptions || []);
    }
  };

  const handleTopicChange = async (selectedOptions) => {
    const last = selectedOptions?.[selectedOptions.length - 1];
    if (last?.value === "new") {
      const rawName = last.__inputValue || last.label;
      try {
        const res = await fetch("/api/topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: rawName }),
        });
        if (res.ok) {
          const created = await res.json();
          setSelTopics([
            ...selectedOptions.slice(0, -1),
            { value: created.id, label: created.name },
          ]);
          return;
        }
      } catch {}
      setSelTopics(selectedOptions.slice(0, -1));
    } else {
      setSelTopics(selectedOptions || []);
    }
  };

  const takeBody = async () => {
    if (!pdfDoc) return;
    const from = Number(bodyFrom) || 1;
    const to = Number(bodyTo) || numPages || from;
    setBodyBusy(true);
    try {
      const text = await extractArticleText(pdfDoc, from, to);
      setContent(text);
      setBodyFrom(String(from));
      setBodyTo(String(to));
    } catch (err) {
      console.error(err);
      setError("Der Fließtext konnte nicht extrahiert werden.");
    } finally {
      setBodyBusy(false);
    }
  };

  // Extrae el texto del rango de páginas y se lo manda a Claude para que lo
  // estructure (título, subtítulo, vorspann, autor, cuerpo con ## entretítulos).
  // Rellena los campos del formulario y acumula tokens/coste del dossier.
  const structureWithClaude = async () => {
    if (!pdfDoc) return;
    const from = Number(bodyFrom) || 1;
    const to = Number(bodyTo) || numPages || from;
    setAiBusy(true);
    setError(null);
    setAiBoundaryNote("");
    try {
      const text = await extractArticleText(pdfDoc, from, to);
      if (!text || !text.trim()) throw new Error("kein Text im Seitenbereich");
      const res = await fetch("/api/ai/structure-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, model: aiModel, title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claude-Fehler");

      if (data.title) setTitle(data.title);
      if (data.boundaryNote) setAiBoundaryNote(data.boundaryNote);
      if (data.subtitle) setSubtitle(data.subtitle);
      if (data.previewText) setPreviewText(data.previewText);
      if (data.body) {
        setContent(data.body);
        // Si el publilab está abierto, re-sembrar su HTML con el nuevo texto.
        if (publilabOn) {
          setContentHtml(bodyTextToHtml(data.body));
          setPublilabKey((k) => k + 1);
        }
      }
      if (data.author) addAuthorByName(data.author);
      setBodyFrom(String(from));
      setBodyTo(String(to));

      if (data.usage) {
        setAiUsage({ ...data.usage, cost: data.cost, model: data.model });
        setAiTotalCost((c) => c + (data.cost || 0));
        setAiTotalTokens((t) => ({
          input: t.input + (data.usage.input_tokens || 0),
          output: t.output + (data.usage.output_tokens || 0),
        }));
        setAiCalls((n) => n + 1);
      }
    } catch (err) {
      console.error(err);
      setError("Claude konnte den Artikel nicht strukturieren: " + err.message);
    } finally {
      setAiBusy(false);
    }
  };

  // Recorta la región entre dos esquinas y la añade a la galería.
  const cropAndAdd = useCallback(
    async (a, b) => {
      if (!pdfDoc) return;
      setCropBusy(true);
      try {
        const blob = await cropPdfRegion(pdfDoc, a.page, a, b);
        if (!blob) throw new Error("crop failed");
        const file = new File([blob], `pdf-bild-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const url = URL.createObjectURL(blob);
        setImages((prev) => [
          ...prev,
          // role: "haupt" = imagen principal (galería) | "text" = insertada inline.
          { id: Date.now(), file, url, page: a.page, title: "", alt: "", role: "haupt" },
        ]);
      } catch (err) {
        console.error(err);
        setError("Das Bild konnte nicht ausgeschnitten werden.");
      } finally {
        setCropBusy(false);
      }
    },
    [pdfDoc]
  );

  const removeImage = (id) => {
    setImages((prev) => {
      const img = prev.find((x) => x.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const updateImageField = (id, field, value) => {
    setImages((prev) =>
      prev.map((x) => (x.id === id ? { ...x, [field]: value } : x))
    );
  };

  // El publilab pide insertar una recortada inline: la subimos al servidor para
  // tener URL persistente, marcamos el rol "text" (sale de la galería principal)
  // y devolvemos la URL final para que el editor la embeba.
  const handleInsertAvailable = useCallback(
    async (id) => {
      const img = images.find((x) => x.id === id);
      if (!img) return null;
      try {
        const fd = new FormData();
        fd.append("file", img.file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || "Upload-Fehler");
        setImages((prev) =>
          prev.map((x) =>
            x.id === id ? { ...x, role: "text", uploadedUrl: data.url } : x
          )
        );
        return data.url;
      } catch (err) {
        console.error("Inline-Upload fehlgeschlagen:", err);
        setError("Das Bild konnte nicht hochgeladen werden.");
        return null;
      }
    },
    [images]
  );

  // Barra de herramientas del PDF: alterna entre selección de texto (nativa) y
  // recorte de imágenes (arrastrar un rectángulo sobre la página).
  const markBar = (
    <div className="flex items-center gap-2 px-1 py-1.5 mb-2 text-xs flex-wrap">
      <span className="text-gray-400">
        {cropMode
          ? "Rechteck über das Bild ziehen → wird ausgeschnitten."
          : "Text markieren & rechts zuweisen."}
      </span>
      <span className="text-gray-300">|</span>
      <button
        type="button"
        onClick={() => setCropMode((m) => !m)}
        disabled={cropBusy}
        className={`px-2 py-0.5 border transition-colors disabled:opacity-40 ${
          cropMode
            ? "bg-blue-600 text-white border-blue-600"
            : "border-blue-600 text-blue-700 hover:bg-blue-50"
        }`}
        title="Ein Rechteck über das Bild ziehen"
      >
        🖼 {cropBusy ? "…" : cropMode ? "Bildmodus aktiv — fertig" : "Bild ausschneiden"}
      </button>
    </div>
  );

  // Scrollea hasta una página dentro del contenedor indicado.
  const scrollToPage = (rootRef, n) => {
    const root = rootRef?.current;
    if (!root) return;
    const el = root.querySelector(`[data-page="${n}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Barra de navegación del visor continuo: ir a página + zoom.
  const renderPageNav = (rootRef) => (
    <div className="flex items-center gap-2 mb-2 flex-wrap text-sm">
      <span className="text-gray-500 text-xs">Gehe zu Seite</span>
      <input
        type="number"
        min={1}
        max={numPages}
        defaultValue={1}
        onChange={(e) => {
          const n = Math.max(1, Math.min(numPages, Number(e.target.value) || 1));
          scrollToPage(rootRef, n);
        }}
        className="w-16 border border-gray-300 px-2 py-1 text-center"
      />
      <span className="text-gray-500">/ {numPages}</span>
      <label className="flex items-center gap-2 text-xs text-gray-500 ml-2">
        Zoom
        <input
          type="range"
          min={400}
          max={1000}
          step={40}
          value={pageWidth}
          onChange={(e) => setPageWidth(Number(e.target.value))}
          className="accent-[#BD0E0D]"
        />
      </label>
    </div>
  );

  // Pila vertical con TODAS las páginas (scroll continuo). Render lazy: cada
  // PdfPageView se dibuja sólo cerca del viewport. La selección nativa con Shift
  // cruza las páginas que estén renderizadas en ese momento.
  const renderPageStack = (width, rootRef) =>
    pdfjs && numPages ? (
      <div className="flex flex-col items-center gap-5">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((p) => (
          <PdfPageView
            key={p}
            pdfDoc={pdfDoc}
            pageNumber={p}
            pdfjs={pdfjs}
            width={width}
            cropMode={cropMode}
            onCrop={cropAndAdd}
            aspect={pageAspect}
            rootRef={rootRef}
          />
        ))}
      </div>
    ) : null;

  const selectedBeitragstyp = beitragstypen.find(
    (b) => String(b.id) === String(beitragstypId)
  );

  // Cuerpo válido: en modo publilab cuenta el HTML (sin tags); si no, el texto.
  const hasBody = publilabOn
    ? contentHtml.replace(/<[^>]+>/g, "").trim().length > 0
    : content.trim().length > 0;
  const canSubmit = title.trim() && hasBody && beitragstypId && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      // En modo publilab el cuerpo ya es HTML; si no, se convierte el texto.
      fd.append("content", publilabOn ? contentHtml : bodyTextToHtml(content));
      fd.append("beitragstypId", String(beitragstypId));
      if (beitragssubtypId) fd.append("beitragssubtypId", String(beitragssubtypId));
      if (subtitle.trim()) fd.append("subtitle", subtitle.trim());
      if (previewText.trim()) fd.append("previewText", previewText.trim());
      if (additionalInfo.trim()) fd.append("additionalInfo", additionalInfo.trim());
      if (editionId) {
        fd.append("isPrinted", "true");
        fd.append("editionId", String(editionId));
        if (bodyFrom) fd.append("startPage", String(bodyFrom));
        if (bodyTo) fd.append("endPage", String(bodyTo));
      }
      // Solo las imágenes "haupt" son imágenes principales del artículo; las
      // "text" ya están subidas y embebidas en el contenido.
      images
        .filter((img) => img.role === "haupt")
        .forEach((img, i) => {
          fd.append(`gallery[${i}][file]`, img.file);
          if (img.title.trim()) fd.append(`gallery[${i}][title]`, img.title.trim());
          if (img.alt.trim()) fd.append(`gallery[${i}][alt]`, img.alt.trim());
        });
      fd.append("authors", JSON.stringify(selAuthors.map((a) => a.id)));
      fd.append("categories", JSON.stringify(selCategories));
      fd.append("regions", JSON.stringify(selRegions.map((r) => r.value)));
      fd.append("topics", JSON.stringify(selTopics.map((t) => t.value)));

      const res = await fetch("/api/articles", { method: "POST", body: fd });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      setCreatedId(created.id);
    } catch (err) {
      console.error(err);
      setError("Der Artikel konnte nicht angelegt werden.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <style>{`
        .pdfsel-textLayer { opacity: 1; line-height: 1; text-align: initial; }
        .pdfsel-textLayer span, .pdfsel-textLayer br {
          color: transparent; position: absolute; white-space: pre;
          cursor: text; transform-origin: 0% 0%;
        }
        .pdfsel-textLayer ::selection { background: rgba(189,14,13,0.35); }
      `}</style>

      <div className="px-4 pt-4">
        <div className="h-[3px] w-16 mb-2" style={{ background: "#BD0E0D" }} />
        <h1
          className="text-2xl font-black tracking-tight text-gray-800"
          style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
        >
          PDF → Artikel
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Dossier öffnen, Text markieren und den Feldern zuordnen. Der Fließtext
          wird über den Seitenbereich automatisch extrahiert.
        </p>
      </div>

      {createdId ? (
        <div className="m-4 p-6 border border-green-300 bg-green-50">
          <p className="text-green-800 font-medium">✓ Artikel angelegt (ID {createdId}).</p>
          <div className="mt-3 flex gap-4">
            <a
              href={`/dashboard/articles/edit/${createdId}`}
              className="text-sm text-[#BD0E0D] hover:underline"
            >
              → Im Editor öffnen (Bilder, Übersetzung…)
            </a>
            <button
              type="button"
              onClick={() => {
                setCreatedId(null);
                setTitle(""); setSubtitle(""); setPreviewText("");
                setAdditionalInfo(""); setContent("");
                setPublilabOn(false); setContentHtml("");
                setSelAuthors([]); setSelCategories([]); setSelRegions([]); setSelTopics([]);
                setCropMode(false);
                images.forEach((img) => URL.revokeObjectURL(img.url));
                setImages([]);
              }}
              className="text-sm text-gray-500 hover:underline"
            >
              + Nächster Artikel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 p-4">
          {/* ── Panel PDF ─────────────────────────────────────── */}
          <div className="lg:w-1/2 flex flex-col">
            {!pdfDoc ? (
              <label className="inline-flex items-center gap-3 px-4 py-2 bg-gray-800 text-white text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors w-max">
                <span>📄 Dossier-PDF auswählen</span>
                <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
              </label>
            ) : (
              <>
                {renderPageNav(scrollRef)}

                {markBar}

                <div
                  ref={scrollRef}
                  className="overflow-auto border border-gray-100 bg-gray-50 p-3 max-h-[78vh]"
                >
                  {renderPageStack(pageWidth, scrollRef)}
                </div>

                <div className="mt-2 text-xs text-gray-500 min-h-[1.5em]">
                  {selectionPreview ? (
                    <>
                      Auswahl: <span className="text-gray-700">“{selectionPreview}{selectionPreview.length >= 140 ? "…" : ""}”</span>
                    </>
                  ) : (
                    "Markiere Text im PDF und weise ihn rechts einem Feld zu."
                  )}
                </div>
              </>
            )}
            {loading && (
              <p className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
                PDF wird geladen…
              </p>
            )}
          </div>

          {/* ── Panel Formulario ──────────────────────────────── */}
          <div className="lg:w-1/2 flex flex-col gap-4">
            {fileName && (
              <p className="text-xs text-gray-400 truncate">{fileName}</p>
            )}

            {/* ── Claude: Artikel automatisch strukturieren ──────── */}
            <div className="border border-[#BD0E0D]/30 bg-[#BD0E0D]/[0.03] p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-700">
                  ✨ Mit Claude strukturieren
                </span>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="text-xs border border-gray-300 px-1.5 py-1 bg-white"
                  title="Modell wählen — Haiku ist günstiger, Sonnet liefert bessere Struktur"
                >
                  <option value="claude-haiku-4-5-20251001">Haiku 4.5 (günstig)</option>
                  <option value="claude-sonnet-4-6">Sonnet 4.6 (beste Qualität)</option>
                </select>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titel (optional — hilft beim Abschneiden am Seitenende)"
                  className="flex-1 border border-gray-300 px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-[#BD0E0D]"
                />
                <button
                  type="button"
                  onClick={takeInto(setTitle)}
                  className="text-xs px-2 py-1 bg-gray-800 text-white hover:bg-gray-700 transition-colors whitespace-nowrap"
                  title="Aktuelle PDF-Auswahl als Titel übernehmen"
                >
                  ← Auswahl
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs text-gray-500">
                <span>Seiten</span>
                <input
                  type="number"
                  min={1}
                  max={numPages || undefined}
                  placeholder="1"
                  value={bodyFrom}
                  onChange={(e) => setBodyFrom(e.target.value)}
                  className="w-14 border border-gray-300 px-1 py-0.5 text-center text-gray-700"
                />
                <span>–</span>
                <input
                  type="number"
                  min={1}
                  max={numPages || undefined}
                  placeholder={String(numPages || 1)}
                  value={bodyTo}
                  onChange={(e) => setBodyTo(e.target.value)}
                  className="w-14 border border-gray-300 px-1 py-0.5 text-center text-gray-700"
                />
                <button
                  type="button"
                  onClick={structureWithClaude}
                  disabled={aiBusy || !pdfDoc}
                  className="px-2.5 py-1 bg-[#BD0E0D] text-white hover:bg-[#a50c0b] transition-colors disabled:opacity-40"
                  title="Seitenbereich extrahieren und von Claude in Felder zerlegen lassen"
                >
                  {aiBusy ? "Claude liest…" : "✨ Felder ausfüllen"}
                </button>
              </div>
              {aiBoundaryNote && (
                <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 leading-relaxed">
                  ✂ {aiBoundaryNote}
                </div>
              )}
              {aiUsage && (
                <div className="mt-2 text-[11px] text-gray-500 leading-relaxed border-t border-[#BD0E0D]/20 pt-2">
                  Letzter Aufruf ({aiUsage.model?.includes("sonnet") ? "Sonnet" : "Haiku"}):{" "}
                  {aiUsage.input_tokens} in / {aiUsage.output_tokens} out ·{" "}
                  {fmtUsd(aiUsage.cost)}
                  <br />
                  Dossier gesamt ({aiCalls} {aiCalls === 1 ? "Artikel" : "Artikel"}):{" "}
                  {aiTotalTokens.input + aiTotalTokens.output} Tokens ·{" "}
                  <strong className="text-gray-700">{fmtUsd(aiTotalCost)}</strong>
                </div>
              )}
            </div>

            {/* Edición + tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Dossier (Ausgabe)
                </label>
                <select
                  value={editionId}
                  onChange={(e) => setEditionId(e.target.value)}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— wählen —</option>
                  {editions.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.number ? `Nr. ${ed.number}` : `#${ed.id}`}
                      {ed.title ? ` · ${ed.title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Beitragstyp <span className="text-[#BD0E0D]">*</span>
                </label>
                <select
                  value={beitragstypId}
                  onChange={(e) => {
                    setBeitragstypId(e.target.value);
                    setBeitragssubtypId("");
                  }}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— wählen —</option>
                  {beitragstypen.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBeitragstyp?.subtypes?.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Subtyp
                </label>
                <select
                  value={beitragssubtypId}
                  onChange={(e) => setBeitragssubtypId(e.target.value)}
                  className="w-full border border-gray-300 px-2 py-1.5 text-sm bg-white"
                >
                  <option value="">— optional —</option>
                  {selectedBeitragstyp.subtypes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <PdfField label="Titel" value={title} onChange={setTitle} onTake={takeInto(setTitle)} required />
            <PdfField label="Untertitel" value={subtitle} onChange={setSubtitle} onTake={takeInto(setSubtitle)} />
            <PdfField label="Vorspann" value={previewText} onChange={setPreviewText} onTake={takeInto(setPreviewText)} multiline />

            {/* Autor */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">Autor:in</label>
                <button
                  type="button"
                  onClick={takeAuthor}
                  disabled={authorBusy}
                  className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
                  title="Auswahl als Autor übernehmen (anlegen falls neu)"
                >
                  {authorBusy ? "…" : "← Auswahl"}
                </button>
              </div>
              {selAuthors.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selAuthors.map((a) => (
                    <span key={a.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
                      {a.name}
                      <button
                        type="button"
                        onClick={() => setSelAuthors((prev) => prev.filter((x) => x.id !== a.id))}
                        className="text-gray-400 hover:text-[#BD0E0D]"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Noch kein Autor zugewiesen.</p>
              )}
            </div>

            {/* Imágenes recortadas del PDF */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Bilder (aus PDF){" "}
                {images.length > 0 && (
                  <span className="text-gray-400 font-normal">
                    · {images.length} · erstes „Hauptbild“ = Titelbild · „Im Text“
                    = im publilab eingefügt
                  </span>
                )}
              </label>
              {images.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="flex gap-3 border border-gray-200 p-2 bg-white"
                    >
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt=""
                          className="h-24 w-auto border border-gray-300 object-contain bg-white"
                        />
                        <span className="absolute bottom-0 left-0 text-[10px] bg-black/60 text-white px-1">
                          S. {img.page}
                        </span>
                        {img.role === "text" ? (
                          <span className="absolute top-0 left-0 text-[10px] bg-blue-600 text-white px-1">
                            Im Text
                          </span>
                        ) : (
                          images.find((x) => x.role === "haupt")?.id ===
                            img.id && (
                            <span className="absolute top-0 left-0 text-[10px] bg-[#BD0E0D] text-white px-1">
                              Hauptbild
                            </span>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-[#BD0E0D] text-white text-xs leading-none flex items-center justify-center hover:bg-[#a50c0b]"
                          aria-label="Bild entfernen"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        {img.role === "text" ? (
                          <p className="text-xs text-gray-400 self-center">
                            Im Fließtext eingebettet (publilab).
                          </p>
                        ) : (
                          <>
                            <input
                              value={img.title}
                              onChange={(e) =>
                                updateImageField(img.id, "title", e.target.value)
                              }
                              placeholder="Titel (Bildunterschrift)"
                              className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#BD0E0D]"
                            />
                            <input
                              value={img.alt}
                              onChange={(e) =>
                                updateImageField(img.id, "alt", e.target.value)
                              }
                              placeholder="Alt-Text (Beschreibung für Screenreader)"
                              className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#BD0E0D]"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Mit „🖼 Bild ausschneiden“ zwei Ecken im PDF anklicken.
                </p>
              )}
            </div>

            {/* Cuerpo */}
            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="text-xs font-medium text-gray-500">
                  Fließtext <span className="text-[#BD0E0D]">*</span>
                  {!publilabOn && content && (
                    <span className="ml-2 text-gray-400 font-normal">
                      {content.length} Zeichen
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  {publilabOn ? (
                    <button
                      type="button"
                      onClick={() => setPublilabOn(false)}
                      className="text-xs px-2 py-0.5 border border-gray-300 text-gray-500 hover:border-gray-500"
                      title="Zurück zum einfachen Texteditor (Auswahl Seite für Seite sammeln)"
                    >
                      ↩ Texteditor
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={appendBody}
                        className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                        title="Aktuelle Auswahl als Absatz anhängen (Seite für Seite sammeln)"
                      >
                        ← Auswahl anhängen
                      </button>
                      <button
                        type="button"
                        onClick={appendHeading}
                        className="text-xs px-2 py-0.5 border border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
                        title="Aktuelle Auswahl als Zwischentitel anhängen (wird zu einer Überschrift)"
                      >
                        ← Zwischentitel
                      </button>
                      <button
                        type="button"
                        onClick={openPublilab}
                        className="text-xs px-2 py-0.5 bg-[#BD0E0D] text-white hover:bg-[#a50c0b] transition-colors"
                        title="Im publilab-Editor öffnen und feinschleifen — Format identisch zum System"
                      >
                        ✍️ publilab
                      </button>
                      <button
                        type="button"
                        onClick={() => setBodyFullscreen(true)}
                        disabled={!pdfDoc}
                        className="text-xs px-2 py-0.5 border border-[#BD0E0D] text-[#BD0E0D] hover:bg-[#BD0E0D]/5 transition-colors disabled:opacity-40"
                        title="Vollbild: PDF links, Artikel rechts"
                      >
                        ⛶ Vollbild
                      </button>
                      {content && (
                        <button
                          type="button"
                          onClick={() => setContent("")}
                          className="text-xs px-2 py-0.5 border border-gray-300 text-gray-500 hover:border-gray-500"
                        >
                          leeren
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {publilabOn ? (
                <InterviewEditor
                  key={publilabKey}
                  value={contentHtml}
                  onChange={setContentHtml}
                  title={title}
                  subtitle={subtitle}
                  availableImages={images
                    .filter((img) => img.role === "haupt")
                    .map((img) => ({
                      id: img.id,
                      url: img.url,
                      title: img.title,
                      alt: img.alt,
                    }))}
                  onInsertAvailable={handleInsertAvailable}
                />
              ) : (
                <>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full border border-gray-300 p-2 text-sm leading-relaxed focus:outline-none focus:border-[#BD0E0D]"
                    rows={10}
                    placeholder="Auswahl im PDF markieren → „Auswahl anhängen“. Zwischentitel mit „← Zwischentitel“ (Zeilen mit ## werden zu Überschriften). Seite wechseln, weiter sammeln, Bilder überspringen."
                  />
                  {/* Alternativa: extraer un rango de páginas de una vez */}
                  <div className="flex items-center gap-1 text-xs mt-1.5 text-gray-400">
                    <span>oder ganze Seiten:</span>
                    <input
                      type="number"
                      min={1}
                      max={numPages || undefined}
                      placeholder="1"
                      value={bodyFrom}
                      onChange={(e) => setBodyFrom(e.target.value)}
                      className="w-14 border border-gray-300 px-1 py-0.5 text-center text-gray-700"
                    />
                    <span>–</span>
                    <input
                      type="number"
                      min={1}
                      max={numPages || undefined}
                      placeholder={String(numPages || 1)}
                      value={bodyTo}
                      onChange={(e) => setBodyTo(e.target.value)}
                      className="w-14 border border-gray-300 px-1 py-0.5 text-center text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={takeBody}
                      disabled={bodyBusy || !pdfDoc}
                      className="px-2 py-0.5 border border-gray-300 text-gray-600 hover:border-gray-500 disabled:opacity-50"
                    >
                      {bodyBusy ? "…" : "extrahieren (ersetzt)"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <PdfField label="Zusatzinfo" value={additionalInfo} onChange={setAdditionalInfo} onTake={takeInto(setAdditionalInfo)} multiline />

            {/* Klassifizierung — mismo comportamiento que ArticleFormV2 */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Kategorien
                </label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {categories.map((category) => (
                    <CheckboxField
                      key={category.id}
                      id={`category-${category.id}`}
                      label={category.name}
                      checked={selCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Regionen
                  </label>
                  <AsyncSelect
                    instanceId="from-pdf-region"
                    inputId="from-pdf-region-select"
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={loadRegions}
                    onChange={handleRegionChange}
                    value={selRegions}
                    placeholder="Region suchen…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Themen
                  </label>
                  <AsyncSelect
                    instanceId="from-pdf-topic"
                    inputId="from-pdf-topic-select"
                    isMulti
                    cacheOptions
                    defaultOptions
                    loadOptions={loadTopics}
                    onChange={handleTopicChange}
                    value={selTopics}
                    placeholder="Thema suchen oder neu anlegen…"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-[#BD0E0D]">⚠ {error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-2.5 bg-[#BD0E0D] text-white text-sm font-bold hover:bg-[#a50c0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-max"
            >
              {submitting ? "Wird angelegt…" : "Artikel anlegen"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modo pantalla completa: PDF | Artículo ──────────────── */}
      {bodyFullscreen && pdfDoc && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
            <span className="text-sm font-bold text-gray-800">
              PDF → Fließtext
              <span className="ml-2 font-normal text-gray-400">{content.length} Zeichen</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={appendBody}
                className="text-xs px-2 py-1 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                title="Aktuelle Auswahl als Absatz anhängen"
              >
                ← Auswahl anhängen
              </button>
              <button
                type="button"
                onClick={appendHeading}
                className="text-xs px-2 py-1 border border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
                title="Aktuelle Auswahl als Zwischentitel anhängen"
              >
                ← Zwischentitel
              </button>
              <button
                type="button"
                onClick={() => setBodyPreview((p) => !p)}
                className="text-xs px-2 py-1 border border-gray-300 text-gray-600 hover:border-gray-500"
              >
                {bodyPreview ? "👁 Vorschau aus" : "👁 Vorschau ein"}
              </button>
              <button
                type="button"
                onClick={() => setBodyFullscreen(false)}
                className="text-xs px-3 py-1 bg-[#BD0E0D] text-white hover:bg-[#a50c0b] transition-colors"
              >
                ✕ Schließen
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0">
            {/* PDF */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 min-h-0">
              <div className="px-3 py-1.5 border-b border-gray-100">
                {renderPageNav(fsScrollRef)}
              </div>
              {markBar}
              <div ref={fsScrollRef} className="flex-1 overflow-auto bg-gray-50 p-3">
                {renderPageStack(pageWidth, fsScrollRef)}
              </div>
              <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-500 min-h-[1.6em]">
                {selectionPreview ? (
                  <>Auswahl: <span className="text-gray-700">“{selectionPreview}{selectionPreview.length >= 140 ? "…" : ""}”</span></>
                ) : (
                  "Markiere Text im PDF und hänge ihn rechts an."
                )}
              </div>
            </div>

            {/* Artículo: siempre editable arriba + vista previa abajo */}
            <div className="w-1/2 flex flex-col min-h-0">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-6 text-sm leading-relaxed resize-none focus:outline-none border-b border-gray-200"
                placeholder="Markiere Text links und hänge ihn an. Leerzeile = neuer Absatz · einfacher Umbruch = Zeilenumbruch · ## = Zwischentitel."
              />
              {bodyPreview && (
                <div className="flex-1 overflow-auto bg-gray-50">
                  <div
                    className="article-content max-w-2xl mx-auto px-8 py-6"
                    dangerouslySetInnerHTML={{
                      __html:
                        bodyTextToHtml(content) ||
                        '<p style="color:#9ca3af">Vorschau erscheint hier.</p>',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

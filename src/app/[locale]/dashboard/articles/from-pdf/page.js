"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
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
// Editor rich para Zusatzinfo (con botón de link), igual que en ArticleFormV2.
const QuillEditor = dynamic(
  () => import("../../../components/QuillEditor/QuillEditor"),
  { ssr: false }
);
// Toolbar reducida para el Vorspann: el default (headers, listas, poema...)
// no entra bien en el panel angosto del modo split (PDF a la izquierda) y el
// toolbar se corta — acá alcanza con negrita/cursiva/link/dossier.
const VORSPANN_TOOLBAR = [["bold", "italic"], ["link"], ["dossier"]];

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

// Limpia un nombre de autor seleccionado del PDF. Los dossiers antiguos usan
// versalitas con inicial drop-cap: "GERT EISENBÜRGER" se extrae como
// "G ERT E ISENBÜRGER" (la inicial grande es un glifo suelto + el resto en
// mayúsculas). Reconstruye y normaliza a Capitalización inicial.
function cleanAuthorName(raw) {
  let s = cleanSelection(raw);
  if (!s) return "";
  // Quita la línea de crédito inicial ("von", "Text:", "Interview:", …).
  s = s.replace(
    /^(von|text|fotos?|bilder?|grafik|illustration|interview)\s*:?\s+/i,
    ""
  );
  // Versalitas: une una inicial suelta con la MAYÚSCULA que la sigue
  // ("G ERT" → "GERT", "E ISENBÜRGER" → "EISENBÜRGER").
  s = s.replace(/\b([A-ZÄÖÜ])\s+(?=[A-ZÄÖÜ])/g, "$1");
  // Pasa palabras enteramente en mayúsculas a Capitalización inicial.
  s = s.replace(/\p{Lu}[\p{Lu}ßẞ'’-]+/gu, (w) =>
    w.charAt(0) + w.slice(1).toLowerCase()
  );
  return s.trim();
}

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

// Procesa los spans de UNA columna (ya aislada por X): agrupa en líneas por Y,
// detecta entretítulos y corta párrafos en líneas cortas con fin de oración.
// Devuelve un array de párrafos (entretítulos prefijados con "## ").
function linesToParagraphs(items, domFont) {
  items.sort((a, b) => a.y - b.y || a.x - b.x);
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
    const hf = {}; // altura → nº de caracteres con esa altura (redondeada)
    for (const it of l.items) {
      // Umbral en base a la altura del span ACTUAL, no de toda la línea
      // (l.h): si un drop cap (letra grande decorativa) cae en el mismo
      // grupo de línea que el texto normal, l.h queda inflado por su altura
      // y ningún espacio entre palabras comunes lo supera — todo el resto
      // de la línea queda pegado sin espacios.
      if (
        text &&
        lastRight !== null &&
        !/\s$/.test(text) &&
        !/^\s/.test(it.str) &&
        it.x - lastRight > it.h * 0.2
      ) {
        text += " ";
      }
      text += it.str;
      lastRight = it.right;
      if (it.font) lf[it.font] = (lf[it.font] || 0) + it.str.length;
      const hKey = Math.round(it.h);
      hf[hKey] = (hf[hKey] || 0) + it.str.length;
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
    // Altura DOMINANTE (la del texto que compone la mayor parte de la
    // línea, ponderada por caracteres) — a diferencia de l.h (el máximo),
    // no la infla un drop cap que comparte grupo de línea con texto normal.
    let hBest = 0;
    let hDominant = l.h;
    for (const h in hf) {
      if (hf[h] > hBest) {
        hBest = hf[h];
        hDominant = Number(h);
      }
    }
    l.hDominant = hDominant;
  }
  const ls = lines.filter((l) => l.text);
  if (!ls.length) return [];

  const colRight = Math.max(...ls.map((l) => l.right));
  const colLeft = Math.min(...ls.map((l) => l.left));
  const shortThreshold = (colRight - colLeft) * 0.06 + 4;
  // hDominant (no l.h) para que una línea fusionada con un drop cap no
  // infle la mediana de altura "típica" de la columna.
  const sortedH = ls.map((l) => l.hDominant).sort((a, b) => a - b);
  const medH = sortedH[Math.floor(sortedH.length / 2)] || 0;

  // ¿Entretítulo? La fuente reportada por el OCR de dossiers escaneados suele
  // ser la misma para todo el documento (una sola fuente "invisible" para
  // permitir seleccionar texto sobre la imagen), así que `l.font !== domFont`
  // casi nunca dispara ahí — no puede ser la única señal. Se agregan dos
  // señales geométricas independientes entre sí (basta con que una se
  // cumpla): una línea claramente más alta que el cuerpo (aunque ocupe todo
  // el ancho — un título puede llenar la columna igual) o una línea
  // marcadamente más corta que el ancho de columna (aunque no sea más alta —
  // la altura del OCR no siempre refleja el tamaño real impreso).
  // Señal de ancho: una línea angosta AISLADA (a lo sumo 2 seguidas) suele
  // ser un título. Una TIRADA LARGA de líneas angostas consecutivas casi
  // siempre es texto envolviendo una imagen incrustada en la columna, no un
  // título — ahí el ancho no sirve como señal y hay que ignorarla.
  const colWidth = colRight - colLeft;
  const narrowMask = ls.map((l) => l.right - l.left < colWidth * 0.75);
  const narrowRunLen = new Array(ls.length).fill(0);
  for (let i = 0; i < ls.length; ) {
    if (!narrowMask[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < ls.length && narrowMask[j]) j++;
    for (let k = i; k < j; k++) narrowRunLen[k] = j - i;
    i = j;
  }

  const isHeading = (l, idx) => {
    const text = l.text;
    // eslint-disable-next-line no-console -- debug temporal, sacar después de calibrar
    console.debug("[isHeading]", {
      text: text.slice(0, 50),
      hDominant: l.hDominant,
      medH,
      hRatio: medH ? +(l.hDominant / medH).toFixed(2) : null,
      font: l.font,
      domFont,
      width: +(l.right - l.left).toFixed(1),
      colWidth: +colWidth.toFixed(1),
      widthRatio: +((l.right - l.left) / colWidth).toFixed(2),
      narrowRunLen: narrowRunLen[idx],
    });
    if (text.length < 3 || text.length > 110) return false;
    if (!/^["'(\[«¿¡]?[A-ZÄÖÜÑÁÉÍÓÚ0-9]/.test(text)) return false;
    // Una línea que termina en "?" es una Frage (entrevista), no un
    // Zwischentitel — se detecta aparte a nivel párrafo en
    // appendChunkToEditor y debe ir siempre a H4, no acá.
    if (/[.!?]["')\]]?\s*$/.test(text)) return false;
    if (domFont && l.font && l.font !== domFont) return true;
    // hDominant, no l.h: una línea fusionada con un drop cap (letra grande
    // decorativa) tiene l.h inflado por esa letra, aunque el resto sea texto
    // normal — hDominant refleja la altura del texto que en verdad compone
    // la línea.
    const tall = medH && l.hDominant >= medH * 1.08;
    if (tall) return true;
    return narrowRunLen[idx] > 0 && narrowRunLen[idx] <= 2;
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
    if (isHeading(l, i)) {
      flushBuf();
      head = head ? head + " " + l.text : l.text;
      continue;
    }
    flushHead();
    // Inicial decorativa (drop cap): una línea con una letra inicial mucho más
    // alta que el cuerpo, pegada al margen izquierdo, marca el comienzo de un
    // párrafo nuevo — aunque la línea anterior haya quedado a ancho completo
    // (texto justificado) y por eso no disparase el corte por línea corta.
    const isDropCapStart =
      medH && l.h >= medH * 1.6 && l.left <= colLeft + shortThreshold;
    if (isDropCapStart) flushBuf();
    if (!buf) buf = l.text;
    else if (/[A-Za-zÄÖÜäöüß]-$/.test(buf) && /^[a-zäöüß]/.test(l.text))
      buf = buf.replace(/-$/, "") + l.text; // de-guionado
    else buf += " " + l.text;
    // Solo cortar párrafo si la línea queda corta Y termina en puntuación de fin
    // de oración. Una línea corta sin punto final suele ser un corte de
    // columna/página (la oración sigue) → no debe partir el párrafo.
    const endsSentence = /[.!?][)"»”'\]]?\s*$/.test(l.text);
    if (l.right < colRight - shortThreshold && endsSentence) flushBuf();
  }
  flushHead();
  flushBuf();
  return paras.filter(Boolean);
}

// Reconstruye los párrafos de la selección por GEOMETRÍA. La selección puede
// abarcar varias COLUMNAS (artículos a 2-3 columnas): primero se aíslan las
// columnas por X (un gutter es un hueco vertical sin texto, mucho mayor que el
// espacio entre palabras), y se lee cada columna entera de arriba a abajo, de
// izquierda a derecha. Así no se mezcla el texto de columnas distintas.
// La selección puede cruzar páginas (visor continuo); como se apilan en
// vertical, ordenar por Y dentro de cada columna encadena las páginas.
// Reconstruye párrafos en orden de lectura a partir de una lista de spans
// ({ str, x, right, y, h, font }). Detecta columnas por huecos en X (gutters):
// al ordenar todo por Y se entremezclan las columnas de un artículo
// multi-columna; en cambio, agrupando por X y procesando cada columna por
// separado se respeta el orden de lectura (cada columna de arriba a abajo,
// columnas de izq. a der.). Lo usan tanto la selección nativa como el
// rectángulo "Textbereich".
function paragraphsFromItems(items) {
  if (!items || !items.length) return "";

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

  const minLeft = Math.min(...items.map((i) => i.x));
  const maxRight = Math.max(...items.map((i) => i.right));
  const totalW = maxRight - minLeft;

  // Detección de columnas por PERFIL DE PROYECCIÓN (franjas verticales en
  // blanco). Marcamos en un histograma horizontal qué tramos de X tienen texto;
  // un gutter entre columnas es una franja sin texto en (casi) todas las líneas.
  // A diferencia del umbral por ancho total, esto NO confunde el espacio ancho
  // entre palabras del texto justificado con un gutter: en un hueco entre
  // palabras otras líneas sí tienen texto en esa X, así que el tramo no queda
  // vacío. Sólo el gutter real (banda blanca de arriba a abajo) lo está.
  const splitColumns = () => {
    if (totalW <= 1) return [items];
    const BINS = 400;
    const binW = totalW / BINS;
    const occ = new Array(BINS).fill(0);
    for (const it of items) {
      const a = Math.max(0, Math.floor((it.x - minLeft) / binW));
      const b = Math.min(BINS - 1, Math.ceil((it.right - minLeft) / binW) - 1);
      for (let k = a; k <= b; k++) occ[k]++;
    }
    const maxOcc = Math.max(...occ);
    // Un bin cuenta como "vacío" si casi ninguna línea lo cubre (tolera que un
    // título suelto cruce el gutter). Y la franja debe tener cierto ancho mínimo
    // (~0,6 em) para no partir por un hueco accidental de una sola línea.
    const emptyThresh = Math.floor(maxOcc * 0.08);
    const hs = items.map((i) => i.h).sort((a, b) => a - b);
    const medH = hs[Math.floor(hs.length / 2)] || 10;
    const minStripBins = Math.max(1, Math.floor((medH * 0.6) / binW));

    const boundaries = [];
    let runStart = -1;
    for (let k = 0; k < BINS; k++) {
      if (occ[k] <= emptyThresh) {
        if (runStart < 0) runStart = k;
      } else {
        if (runStart >= 0 && k - runStart >= minStripBins) {
          boundaries.push(minLeft + ((runStart + k) / 2) * binW);
        }
        runStart = -1;
      }
    }
    if (!boundaries.length) return [items];

    const colOf = (cx) => {
      let i = 0;
      while (i < boundaries.length && cx > boundaries[i]) i++;
      return i;
    };
    const buckets = new Map();
    for (const it of items) {
      const ci = colOf((it.x + it.right) / 2);
      if (!buckets.has(ci)) buckets.set(ci, []);
      buckets.get(ci).push(it);
    }
    return [...buckets.keys()].sort((a, b) => a - b).map((k) => buckets.get(k));
  };

  const out = [];
  for (const colItems of splitColumns())
    out.push(...linesToParagraphs(colItems, domFont));
  return out.filter(Boolean).join("\n\n");
}

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
  return paragraphsFromItems(items);
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
function PdfPageView({ pdfDoc, pageNumber, pdfjs, width, cropMode, onCrop, textRegionMode, onTextRegion, aspect, rootRef }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const renderRef = useRef(null);
  const taskRef = useRef(null);
  const [dims, setDims] = useState(null); // { scale, pageHeight } a escala 1
  const [visible, setVisible] = useState(false);
  // Rectángulo de arrastre en px relativos al canvas: { x0, y0, x1, y1 }.
  const [drag, setDrag] = useState(null);
  // En modo "Textbereich" el rectángulo queda fijo tras soltar (para poder
  // rehacerlo) y sólo se transcribe al pulsar el botón. { left, top, right, bottom }.
  const [committed, setCommitted] = useState(null);
  // Última región ya insertada en el editor: queda marcada (verde) como referencia
  // de "hasta acá copié" para no perder el hilo. Persiste aunque se salga del modo.
  const [lastInserted, setLastInserted] = useState(null);

  // Al salir del modo texto se descarta el rectángulo pendiente (no el marcador).
  useEffect(() => {
    if (!textRegionMode) setCommitted(null);
  }, [textRegionMode]);

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

  // Ambos modos (recorte de imagen y "Textbereich") usan el mismo arrastre.
  const dragMode = cropMode || textRegionMode;

  const onDragStart = (e) => {
    if (!dragMode || !dims || !canvasRef.current) return;
    e.preventDefault();
    // Un nuevo arrastre en modo texto descarta el rectángulo fijo anterior.
    if (textRegionMode) setCommitted(null);
    const { x, y } = localPx(e);
    setDrag({ x0: x, y0: y, x1: x, y1: y });
  };

  const onDragMove = (e) => {
    if (!drag) return;
    const { x, y } = localPx(e);
    setDrag((d) => (d ? { ...d, x1: x, y1: y } : d));
  };

  // Spans del text-layer cuyo centro cae dentro del rectángulo (en px locales al
  // canvas). Devuelve items con la forma que espera paragraphsFromItems.
  const collectTextInRect = (left, top, right, bottom) => {
    const layer = textLayerRef.current;
    const canvas = canvasRef.current;
    if (!layer || !canvas) return [];
    const cRect = canvas.getBoundingClientRect();
    const items = [];
    layer.querySelectorAll("span").forEach((s) => {
      if (!s.firstChild || !s.textContent || !s.textContent.trim()) return;
      const r = s.getBoundingClientRect();
      const x = r.left - cRect.left;
      const y = r.top - cRect.top;
      const cxx = x + r.width / 2;
      const cyy = y + r.height / 2;
      if (cxx >= left && cxx <= right && cyy >= top && cyy <= bottom) {
        items.push({
          str: s.textContent,
          x,
          right: x + r.width,
          y,
          h: r.height,
          font: s.style.fontFamily || "",
        });
      }
    });
    return items;
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
    if (textRegionMode) {
      // No transcribe aún: deja el rectángulo fijo para ajustarlo; se transcribe
      // al pulsar el botón "einfügen".
      setCommitted({ left, top, right, bottom });
      return;
    }
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
          style={{ width, cursor: dragMode ? "crosshair" : "auto" }}
          onMouseDown={onDragStart}
          onMouseMove={onDragMove}
          onMouseUp={onDragEnd}
          // Si el ratón sale del área (típico al seleccionar la última columna,
          // pegada al borde derecho), confirmamos el arrastre en vez de
          // cancelarlo — antes se perdía la selección de la columna del borde.
          onMouseLeave={onDragEnd}
        >
          <canvas ref={canvasRef} className="block bg-white shadow-lg" />
          <div
            ref={textLayerRef}
            className="pdfsel-textLayer absolute top-0 left-0"
            style={{
              lineHeight: 1,
              pointerEvents: dragMode ? "none" : "auto",
            }}
          />
          {dragRect && (
            <div
              className={`absolute border-2 pointer-events-none ${
                textRegionMode
                  ? "border-[#BD0E0D] bg-[#BD0E0D]/20"
                  : "border-blue-600 bg-blue-500/20"
              }`}
              style={{
                left: dragRect.left,
                top: dragRect.top,
                width: dragRect.width,
                height: dragRect.height,
              }}
            />
          )}
          {/* Marcador de progreso: última región insertada en el editor. Queda
              verde como referencia de "hasta acá copié"; pointer-events ninguno. */}
          {lastInserted && (
            <div
              className="absolute border-2 border-dashed border-green-600 bg-green-500/10 pointer-events-none"
              style={{
                left: lastInserted.left,
                top: lastInserted.top,
                width: lastInserted.right - lastInserted.left,
                height: lastInserted.bottom - lastInserted.top,
              }}
            >
              <span className="absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold bg-green-600 text-white shadow whitespace-nowrap">
                ✓ kopiert
              </span>
            </div>
          )}
          {/* Rectángulo fijo del modo texto: queda hasta pulsar "einfügen"
              (o redibujar). El botón inserta el texto y limpia el rectángulo. */}
          {textRegionMode && committed && !drag && (
            <>
              <div
                className="absolute border-2 border-dashed border-[#BD0E0D] bg-[#BD0E0D]/10 pointer-events-none"
                style={{
                  left: committed.left,
                  top: committed.top,
                  width: committed.right - committed.left,
                  height: committed.bottom - committed.top,
                }}
              />
              <div
                className="absolute z-20 flex gap-1"
                style={{ left: committed.left, top: committed.bottom + 4 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTextRegion?.(
                      collectTextInRect(
                        committed.left,
                        committed.top,
                        committed.right,
                        committed.bottom
                      )
                    );
                    setLastInserted(committed);
                    setCommitted(null);
                  }}
                  className="px-2.5 py-1 text-xs bg-[#BD0E0D] text-white shadow hover:bg-[#a50c0b] transition-colors"
                >
                  📝 Text einfügen
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCommitted(null);
                  }}
                  className="px-2 py-1 text-xs bg-white border border-gray-300 text-gray-500 shadow hover:border-gray-500 transition-colors"
                  title="Auswahl verwerfen"
                >
                  ✕
                </button>
              </div>
            </>
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
function PdfField({ label, value, onChange, onTake, getSelection, multiline, required, onFocusField }) {
  // Recuerda la posición del cursor en el campo para poder insertar la selección
  // del PDF justo ahí (útil con Vorspann/texto partido en columnas).
  const caretRef = useRef(null);
  const rememberCaret = (e) => {
    caretRef.current = e.target.selectionStart;
  };

  // Inserta la selección del PDF en la posición del cursor (o al final),
  // uniéndola con un espacio en vez de reemplazar lo que ya hay.
  const appendSelection = () => {
    const sel = (getSelection?.() || "").trim();
    if (!sel) return;
    const cur = value || "";
    let pos = caretRef.current;
    if (pos == null || pos > cur.length) pos = cur.length;
    const left = cur.slice(0, pos).replace(/\s+$/, "");
    const right = cur.slice(pos).replace(/^\s+/, "");
    const next = [left, sel, right].filter(Boolean).join(" ");
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-500">
          {label} {required && <span className="text-[#BD0E0D]">*</span>}
        </label>
        <div className="flex items-center gap-1">
          {getSelection && (
            <button
              type="button"
              onClick={appendSelection}
              className="text-xs px-2 py-0.5 border border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
              title="PDF-Auswahl an der Cursorposition einfügen (anhängen, nicht ersetzen)"
            >
              ＋ einfügen
            </button>
          )}
          <button
            type="button"
            onClick={onTake}
            className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            title="Aktuelle PDF-Auswahl übernehmen (ersetzt das Feld)"
          >
            ← Auswahl
          </button>
        </div>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={rememberCaret}
          onKeyUp={rememberCaret}
          onClick={rememberCaret}
          onFocus={onFocusField}
          className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
          rows={3}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={rememberCaret}
          onKeyUp={rememberCaret}
          onClick={rememberCaret}
          onFocus={onFocusField}
          className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
        />
      )}
    </div>
  );
}

export default function FromPdfPage() {
  const { data: session } = useSession();
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
  const floatBarRef = useRef(null); // barra flotante anclada al visualViewport
  const editorApi = useRef(null); // API del publilab en modo split: { appendText, appendHeading }
  const [pageWidth, setPageWidth] = useState(620);
  const [loading, setLoading] = useState(false);

  // Selector de dossiers ya subidos al módulo Digital-ABO (EditionPdf).
  // Permite traer el PDF desde el servidor en vez de hacer upload manual.
  const [dossiers, setDossiers] = useState([]);
  const [dossierPickerOpen, setDossierPickerOpen] = useState(false);
  const [loadingDossiers, setLoadingDossiers] = useState(false);

  // Selección actual del PDF.
  const lastSelectionRef = useRef("");
  const bodyParasRef = useRef(""); // párrafos reconstruidos por geometría
  const [selectionPreview, setSelectionPreview] = useState("");

  // Último campo de texto enfocado ("body" | "vorspann") — decide a dónde va
  // el "Textbereich" al insertar. Nunca se resetea solo al perder foco (igual
  // que lastFocusedBlockRef en InterviewEditor): arrastrar la selección en el
  // PDF no debe "olvidar" que se estaba escribiendo el Vorspann.
  const activeFieldRef = useRef("body");

  // Campos del artículo.
  // Fecha de publicación editable (antes fija a "ahora" sin forma de
  // cambiarla). Si queda en el futuro, el artículo se crea programado
  // (isPublished se deriva de esto al enviar), igual que en new/page.js.
  const [publicationDate, setPublicationDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [content, setContent] = useState("");

  // Publilab (InterviewEditor) como editor del Fließtext. El cuerpo se compone en
  // el Vollbild (PDF + publilab); al guardar, `contentHtml` es la fuente de verdad
  // (publilabOn=true). Antes de tocarlo, `content` guarda el texto plano que
  // pudo rellenar Claude ("## " = entretítulo).
  const [publilabOn, setPublilabOn] = useState(false);
  const [contentHtml, setContentHtml] = useState("");

  // Relaciones / catálogos.
  const [editions, setEditions] = useState([]);
  const [editionId, setEditionId] = useState("");

  // Artículos que YA existen en el dossier elegido — para que quien
  // transcribe pueda chequear si un artículo del índice ya se cargó antes de
  // volver a tipearlo. Se recarga cada vez que cambia editionId.
  const [existingArticles, setExistingArticles] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingOpen, setExistingOpen] = useState(true);
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

  // Entrevistado/a (solo aplica si el Beitragstyp elegido es "Interview",
  // igual que en ArticleFormV2).
  const [selInterviewees, setSelInterviewees] = useState([]);

  // Rango de páginas del cuerpo (referencia de la edición impresa: startPage/endPage).
  const [bodyFrom, setBodyFrom] = useState("");
  const [bodyTo, setBodyTo] = useState("");

  // Recorte de imágenes del PDF (dos esquinas → JPEG → galería).
  const [cropMode, setCropMode] = useState(false); // arrastrar para recortar
  const [images, setImages] = useState([]); // { id, file, url, page, title, alt }
  const [cropBusy, setCropBusy] = useState(false);

  // "Textbereich": arrastrar un rectángulo sobre el cuerpo → extrae el texto
  // dentro, lo reordena por columnas y lo inyecta como bloques en el publilab.
  const [textRegionMode, setTextRegionMode] = useState(false);

  // Editor de cuerpo a pantalla completa (PDF | artículo).
  const [bodyFullscreen, setBodyFullscreen] = useState(false);

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

  // Recarga los artículos ya cargados del dossier elegido (todos, publicados
  // o no — es un tool de admin). El endpoint recibe el NÚMERO de edición, no
  // el id de la BD. Reutilizable: la dispara el cambio de editionId y,
  // manualmente, la creación de un artículo nuevo (para que la lista no
  // quede vieja mientras se sigue transcribiendo el mismo dossier).
  const refreshExistingArticles = useCallback(
    async (edId) => {
      const edition = editions.find((ed) => String(ed.id) === String(edId));
      if (!edition) return;
      setLoadingExisting(true);
      try {
        const res = await fetch(`/api/articles/edition/${edition.number}`);
        const d = res.ok ? await res.json() : [];
        setExistingArticles(Array.isArray(d) ? d : []);
      } catch {
        setExistingArticles([]);
      } finally {
        setLoadingExisting(false);
      }
    },
    [editions]
  );

  useEffect(() => {
    if (!editionId) {
      setExistingArticles([]);
      return;
    }
    refreshExistingArticles(editionId);
  }, [editionId, refreshExistingArticles]);

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

  // Mantiene la barra flotante de inserción dentro del área visible aunque se
  // haga pinch-zoom o zoom del navegador. position:fixed se ancla al layout
  // viewport (que con el zoom queda fuera de vista), así que la reposicionamos
  // según el visualViewport (lo que el usuario realmente ve).
  useEffect(() => {
    if (!bodyFullscreen) return;
    const vv = window.visualViewport;
    const update = () => {
      const el = floatBarRef.current;
      if (!el) return;
      const w = vv ? vv.width : window.innerWidth;
      const h = vv ? vv.height : window.innerHeight;
      const ox = vv ? vv.offsetLeft : 0;
      const oy = vv ? vv.offsetTop : 0;
      el.style.bottom = "auto";
      el.style.left = `${ox + w / 2}px`;
      el.style.top = `${oy + h - 24}px`;
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    if (vv) {
      vv.addEventListener("resize", update);
      vv.addEventListener("scroll", update);
    }
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      if (vv) {
        vv.removeEventListener("resize", update);
        vv.removeEventListener("scroll", update);
      }
    };
  }, [bodyFullscreen]);

  // Carga un PDF (ya leído como ArrayBuffer) en el visor y reinicia el estado del
  // dossier. Reutilizado por el upload manual y por el selector de Digital-ABO.
  const loadPdfBuffer = async (buffer, name) => {
    if (!pdfjs) return;
    setError(null);
    setLoading(true);
    setFileName(name);
    // Nuevo dossier → cierra el publilab y limpia su HTML.
    setPublilabOn(false);
    setContentHtml("");
    try {
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

  // Lista los dossiers que ya tienen PDF subido en el módulo Digital-ABO.
  const loadDossiers = async () => {
    setLoadingDossiers(true);
    try {
      const res = await fetch(
        "/api/editions?admin=true&limit=500&sortField=number&sortOrder=desc"
      );
      const data = await res.json();
      const items = (data?.items || [])
        .filter((e) => e.pdf?.pdfUrl)
        .map((e) => ({
          id: e.id,
          number: e.number,
          title: e.title,
          pdfUrl: e.pdf.pdfUrl,
        }));
      setDossiers(items);
    } catch (err) {
      console.error("Dossier-Liste error:", err);
      setError("Die Dossier-Liste konnte nicht geladen werden.");
    } finally {
      setLoadingDossiers(false);
    }
  };

  const openDossierPicker = () => {
    setDossierPickerOpen(true);
    if (dossiers.length === 0) loadDossiers();
  };

  // Trae el PDF del dossier elegido desde el servidor y lo carga en el visor.
  const pickDossier = async (d) => {
    setDossierPickerOpen(false);
    setLoading(true);
    // El dossier elegido para transcribir es, casi siempre, el mismo que va
    // en "Dossier (Ausgabe)" — se fija solo para no tener que elegirlo de
    // nuevo, y de paso dispara la carga de artículos ya existentes.
    setEditionId(String(d.id));
    try {
      const res = await fetch(d.pdfUrl);
      if (!res.ok) throw new Error("fetch pdf failed");
      const buffer = await res.arrayBuffer();
      await loadPdfBuffer(buffer, `ila ${d.number} — ${d.title}`);
    } catch (err) {
      console.error("Dossier-PDF load error:", err);
      setError("Das Dossier-PDF konnte nicht geladen werden.");
      setLoading(false);
    }
  };

  const takeInto = (setter) => () => {
    const clean = cleanSelection(lastSelectionRef.current);
    if (clean) setter(clean);
  };

  // ── Vollbild = publilab con el PDF acoplado a la izquierda (modo split) ─────
  // Inserta la selección del PDF como bloques en el publilab vía su API. Respeta
  // los párrafos y la detección de entretítulos de reflowBodySelection.
  const appendChunkToEditor = (raw) => {
    const chunk = reflowBodySelection(raw);
    if (!chunk) return;
    // En el Vollbild se inyecta como bloques del publilab; en la vista normal
    // (sin editor abierto) se acumula en el texto plano del cuerpo.
    if (!editorApi.current) {
      setContent((prev) => (prev ? prev + "\n\n" : "") + chunk);
      return;
    }
    chunk.split(/\n{2,}/).forEach((part) => {
      const h = part.match(/^#{2,3}\s+(.+)$/);
      const flat = part.replace(/\n/g, " ").trim();
      if (h) {
        editorApi.current.appendHeading(h[1].trim(), 3);
      } else if (/\?["')\]]?\s*$/.test(flat) && flat.length <= 300) {
        // Entrevista: un párrafo entero que termina en "?" es una Frage —
        // suelen ser 1-2 oraciones bastante más largas que un Zwischentitel,
        // por eso se detecta acá (a nivel párrafo) y no en isHeading (línea).
        editorApi.current.appendQuestion(flat);
      } else {
        editorApi.current.appendText(`<p>${escapeHtml(flat)}</p>`);
      }
    });
  };
  const appendBodyToEditor = () =>
    appendChunkToEditor(bodyParasRef.current || lastSelectionRef.current);
  const appendHeadingToEditor = () => {
    const clean = cleanSelection(lastSelectionRef.current);
    if (clean && editorApi.current) editorApi.current.appendHeading(clean, 3);
  };

  // "Textbereich": recibe los spans dentro del rectángulo, los reordena por
  // columnas (orden de lectura) y los anexa al campo activo — el cuerpo por
  // defecto, o Titel/Untertitel/Vorspann/Zusatzinfo si fue el último campo
  // enfocado.
  const takeTextRegion = (items) => {
    const text = paragraphsFromItems(items);
    if (!text) return;
    setSelectionPreview(cleanSelection(text).slice(0, 140));
    const field = activeFieldRef.current;
    if (field === "title" || field === "subtitle") {
      // Titel/Untertitel son de una sola línea: aplanar todo a texto plano,
      // sin marcas de entretítulo ni saltos de párrafo.
      const flat = text
        .split(/\n+/)
        .map((p) => cleanSelection(p).replace(/^#{2,3}\s+/, ""))
        .filter(Boolean)
        .join(" ")
        .trim();
      if (!flat) return;
      const setter = field === "title" ? setTitle : setSubtitle;
      setter((prev) => (prev ? prev + " " + flat : flat));
      return;
    }
    if (field === "vorspann" || field === "additionalInfo") {
      const html = text
        .split(/\n{2,}/)
        .map((p) => cleanSelection(p).replace(/^#{2,3}\s+/, ""))
        .filter(Boolean)
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join("");
      if (!html) return;
      const setter = field === "vorspann" ? setPreviewText : setAdditionalInfo;
      setter((prev) => (prev || "") + html);
      return;
    }
    appendChunkToEditor(text);
  };

  // Abre el Vollbild. Siembra contentHtml desde el textarea si el publilab aún
  // no es la fuente de verdad, para no perder lo ya recolectado.
  const openBodyFullscreen = () => {
    if (!pdfDoc) return;
    if (!publilabOn) setContentHtml(bodyTextToHtml(content));
    setBodyFullscreen(true);
    // El Vorspann no está visible en el Vollbild — si quedó como campo
    // activo, un "Textbereich" ahí adentro iría a un campo fuera de vista.
    activeFieldRef.current = "body";
  };
  // Al cerrar, el publilab pasa a ser la fuente de verdad en la vista normal.
  const closeBodyFullscreen = () => {
    setBodyFullscreen(false);
    setPublilabOn(true);
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
    () => addAuthorByName(cleanAuthorName(lastSelectionRef.current)),
    [addAuthorByName]
  );

  // Buscador de autores (igual que Regionen/Themen): si no hay match exacto,
  // ofrece "➕ Neu anlegen" al final de la lista — mismo comportamiento
  // check-existe-o-crea que "← Auswahl", pero sin depender de la selección
  // del PDF.
  // async: AsyncSelect espera que loadOptions devuelva una Promise (igual que
  // loadRegions/loadTopics) — una función sync que devuelve un array plano
  // deja el spinner de carga colgado para siempre, porque el array no tiene
  // .then().
  const loadAuthorOptions = async (inputValue) => {
    const q = (inputValue || "").trim();
    const flat = authorsCache.map((a) => ({ value: a.id, label: a.name }));
    const ranked = q ? rankOptions(flat, q) : flat.slice(0, 50);
    if (!q) return ranked;
    const norm = (s) => (s || "").trim().toLowerCase();
    const hasExact = flat.some((o) => norm(o.label) === norm(q));
    const maybeCreate = hasExact
      ? []
      : [{ value: "new", label: `➕ Neu anlegen: "${q}"`, __inputValue: q }];
    return [...maybeCreate, ...ranked];
  };

  const handleAuthorSelectChange = (selectedOptions) => {
    const opts = selectedOptions || [];
    const last = opts[opts.length - 1];
    if (last?.value === "new") {
      addAuthorByName(last.__inputValue || last.label);
      return;
    }
    const byId = new Map(authorsCache.map((a) => [a.id, a]));
    setSelAuthors(
      opts.map((o) => byId.get(o.value) || { id: o.value, name: o.label })
    );
  };

  // Buscador de entrevistados (igual patrón que Themen: búsqueda en el
  // servidor con /api/interviewees?search=, "➕ Neu anlegen" si no hay match
  // exacto; el POST ya hace check-existe-o-crea del lado del servidor).
  const loadIntervieweeOptions = async (inputValue) => {
    const q = (inputValue || "").trim();
    try {
      const res = await fetch(`/api/interviewees?search=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const data = await res.json();
      const flat = data.map((i) => ({ value: i.id, label: i.name }));
      if (!q) return flat;
      const norm = (s) => (s || "").trim().toLowerCase();
      const hasExact = flat.some((o) => norm(o.label) === norm(q));
      const maybeCreate = hasExact
        ? []
        : [{ value: "new", label: `➕ Neu anlegen: "${q}"`, __inputValue: q }];
      return [...maybeCreate, ...flat];
    } catch {
      return [];
    }
  };

  const handleIntervieweeSelectChange = async (selectedOptions) => {
    const opts = selectedOptions || [];
    const last = opts[opts.length - 1];
    if (last?.value !== "new") {
      setSelInterviewees(opts);
      return;
    }
    const rawName = (last.__inputValue || last.label).trim();
    try {
      const res = await fetch("/api/interviewees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rawName }),
      });
      if (res.ok) {
        const created = await res.json();
        setSelInterviewees([
          ...opts.slice(0, -1),
          { value: created.id, label: created.name },
        ]);
        return;
      }
    } catch {}
    setSelInterviewees(opts.slice(0, -1));
  };

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

  // Barra de herramientas del PDF: selección nativa de texto · "Textbereich"
  // (rectángulo → texto reordenado por columnas) · recorte de imágenes.
  const markBar = (
    <div className="flex items-center gap-2 px-1 py-1.5 mb-2 text-xs flex-wrap">
      <span className="text-gray-400">
        {textRegionMode
          ? "Rechteck über den Artikeltext ziehen → bleibt stehen; mit „Text einfügen“ übernehmen (oder neu ziehen)."
          : cropMode
            ? "Rechteck über das Bild ziehen → wird ausgeschnitten."
            : "Text markieren & rechts zuweisen — oder „Textbereich“ für ganze Spalten."}
      </span>
      <span className="text-gray-300">|</span>
      <button
        type="button"
        onClick={() => {
          setTextRegionMode((m) => !m);
          setCropMode(false);
        }}
        className={`px-2 py-0.5 border transition-colors ${
          textRegionMode
            ? "bg-[#BD0E0D] text-white border-[#BD0E0D]"
            : "border-[#BD0E0D] text-[#BD0E0D] hover:bg-[#BD0E0D]/10"
        }`}
        title="Ein Rechteck über den Artikeltext ziehen — der Text wird spaltenweise eingefügt"
      >
        📝 {textRegionMode ? "Textbereich aktiv — fertig" : "Textbereich"}
      </button>
      <button
        type="button"
        onClick={() => {
          setCropMode((m) => !m);
          setTextRegionMode(false);
        }}
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
      <button
        type="button"
        onClick={() => {
          // El formulario (título/contenido/imágenes) NO se borra al cambiar
          // de dossier — solo advertir si ya hay algo escrito, para no
          // confundirse mirando un PDF distinto con datos de otro artículo.
          if (
            (title.trim() || hasBody) &&
            !confirm(
              "Es gibt schon Angaben für diesen Artikel. Trotzdem das Dossier wechseln?"
            )
          )
            return;
          openDossierPicker();
        }}
        className="ml-auto text-xs px-2 py-1 border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
        title="Anderes Dossier öffnen, ohne zurückzugehen"
      >
        🔁 Dossier wechseln
      </button>
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
            textRegionMode={textRegionMode}
            onTextRegion={takeTextRegion}
            aspect={pageAspect}
            rootRef={rootRef}
          />
        ))}
      </div>
    ) : null;

  const selectedBeitragstyp = beitragstypen.find(
    (b) => String(b.id) === String(beitragstypId)
  );
  // Igual criterio que ArticleFormV2: el Beitragstyp "Interview" habilita el
  // campo de entrevistado/a.
  const isInterview = selectedBeitragstyp?.name === "Interview";

  // Cuerpo válido: en modo publilab cuenta el HTML (sin tags); si no, el texto.
  const hasBody = publilabOn
    ? contentHtml.replace(/<[^>]+>/g, "").trim().length > 0
    : content.trim().length > 0;
  // Vista previa del cuerpo en la tarjeta de entrada al publilab.
  const bodyPreviewHtml = publilabOn ? contentHtml : bodyTextToHtml(content);
  const bodyTextLen = bodyPreviewHtml.replace(/<[^>]+>/g, "").trim().length;
  const canSubmit = title.trim() && hasBody && beitragstypId && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      // Sin esto el backend no genera el log de actividad CREATE_ARTICLE
      // (ver /api/articles/route.js: solo loguea si viene "userId").
      if (session?.user?.id) fd.append("userId", session.user.id);
      // Marca para métricas: este artículo se transcribió con el tool from-pdf.
      fd.append("createdFromPdf", "true");
      // Fecha elegida en el campo "Datum" — pasado/hoy publica de inmediato,
      // futuro deja el artículo programado (mismo criterio que new/page.js).
      const pubDate = publicationDate ? new Date(publicationDate) : new Date();
      fd.append("isPublished", String(pubDate <= new Date()));
      fd.append("publicationDate", pubDate.toISOString());
      // En modo publilab el cuerpo ya es HTML; si no, se convierte el texto.
      fd.append("content", publilabOn ? contentHtml : bodyTextToHtml(content));
      fd.append("beitragstypId", String(beitragstypId));
      if (beitragssubtypId) fd.append("beitragssubtypId", String(beitragssubtypId));
      if (subtitle.trim()) fd.append("subtitle", subtitle.trim());
      if (previewText.trim()) fd.append("previewText", previewText.trim());
      // Quill vacío produce "<p><br></p>"; solo enviar si hay texto real.
      if (additionalInfo.replace(/<[^>]+>/g, "").trim())
        fd.append("additionalInfo", additionalInfo.trim());
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
      if (isInterview)
        fd.append(
          "interviewees",
          JSON.stringify(selInterviewees.map((i) => i.value))
        );
      fd.append("categories", JSON.stringify(selCategories));
      fd.append("regions", JSON.stringify(selRegions.map((r) => r.value)));
      fd.append("topics", JSON.stringify(selTopics.map((t) => t.value)));

      const res = await fetch("/api/articles", { method: "POST", body: fd });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      setCreatedId(created.id);
      if (editionId) refreshExistingArticles(editionId);
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
                setPublicationDate(new Date().toISOString().slice(0, 10));
                setTitle(""); setSubtitle(""); setPreviewText("");
                setAdditionalInfo(""); setContent("");
                setPublilabOn(false); setContentHtml("");
                setSelAuthors([]); setSelInterviewees([]); setSelCategories([]); setSelRegions([]); setSelTopics([]);
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
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={openDossierPicker}
                  className="inline-flex items-center gap-3 px-4 py-2 bg-[#BD0E0D] text-white text-sm font-medium cursor-pointer hover:bg-[#A30C0B] transition-colors w-max"
                >
                  <span>📚 Aus PDF-Abo wählen</span>
                </button>
              </div>
            ) : (
              <>
                {/* Artículos ya cargados en este dossier — para chequear contra
                    el índice antes de transcribir uno que ya existe. */}
                {editionId && (
                  <div className="mb-2 border border-gray-200 bg-white text-xs">
                    <button
                      type="button"
                      onClick={() => setExistingOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <span>
                        📋 Bereits im Dossier:{" "}
                        {loadingExisting ? "…" : existingArticles.length}
                      </span>
                      <span>{existingOpen ? "▲" : "▼"}</span>
                    </button>
                    {existingOpen &&
                      (loadingExisting ? (
                        <p className="px-2 pb-2 text-gray-400">Lade…</p>
                      ) : existingArticles.length === 0 ? (
                        <p className="px-2 pb-2 text-gray-400">
                          Noch keine Artikel geladen.
                        </p>
                      ) : (
                        <ul className="max-h-40 overflow-auto divide-y divide-gray-100 border-t border-gray-100">
                          {existingArticles.map((a) => (
                            <li
                              key={a.id}
                              className="px-2 py-1 flex items-center justify-between gap-2"
                            >
                              <span className="truncate text-gray-700" title={a.title}>
                                {a.title}
                                {a.authors?.length > 0 && (
                                  <span className="text-gray-400">
                                    {" "}
                                    — {a.authors.map((au) => au.name).join(", ")}
                                  </span>
                                )}
                              </span>
                              {!a.isPublished && (
                                <span className="shrink-0 text-[10px] px-1 bg-yellow-100 text-yellow-700">
                                  Entwurf
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ))}
                  </div>
                )}

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

            {/* ── Seiten (Referenz für die gedruckte Ausgabe: startPage/endPage) ── */}
            <div className="border border-gray-200 p-3">
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
                <span className="font-medium text-gray-700">Seiten</span>
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
              </div>
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

            <PdfField label="Titel" value={title} onChange={setTitle} onTake={takeInto(setTitle)} getSelection={() => cleanSelection(lastSelectionRef.current)} onFocusField={() => { activeFieldRef.current = "title"; }} required />
            <PdfField label="Untertitel" value={subtitle} onChange={setSubtitle} onTake={takeInto(setSubtitle)} getSelection={() => cleanSelection(lastSelectionRef.current)} onFocusField={() => { activeFieldRef.current = "subtitle"; }} />

            {/* Antes fija a "ahora" sin poder cambiarla — pasado/hoy publica
                de inmediato, futuro programa el artículo. */}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">
                Datum
              </label>
              <input
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                className="border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#BD0E0D]"
              />
            </div>
            {/* Vorspann con QuillEditor (negrita/cursiva/link/dossier), igual que
                el resto de los formularios — antes era un textarea plano sin
                ningún formato. "← Auswahl" reemplaza el contenido, "＋ einfügen"
                agrega la selección al final (con Quill no hay caret a seguir).
                onFocus (con bubbling desde el contenteditable de Quill) marca
                este campo como destino del "Textbereich" del PDF. */}
            <div onFocus={() => { activeFieldRef.current = "vorspann"; }}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">Vorspann</label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const sel = cleanSelection(lastSelectionRef.current);
                      if (sel)
                        setPreviewText(
                          (previewText || "") + `<p>${escapeHtml(sel)}</p>`
                        );
                    }}
                    className="text-xs px-2 py-0.5 border border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
                    title="PDF-Auswahl ans Ende anhängen"
                  >
                    ＋ einfügen
                  </button>
                  <button
                    type="button"
                    onClick={takeInto(setPreviewText)}
                    className="text-xs px-2 py-0.5 bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                    title="Aktuelle PDF-Auswahl übernehmen (ersetzt das Feld)"
                  >
                    ← Auswahl
                  </button>
                </div>
              </div>
              <QuillEditor
                value={previewText}
                onChange={setPreviewText}
                toolbar={VORSPANN_TOOLBAR}
              />
            </div>

            {/* Autor: buscador con check-existe-o-crea (igual que Regionen/
                Themen) + botón rápido para tomar la selección del PDF. Los
                chips seleccionados los muestra el propio AsyncSelect (isMulti). */}
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
              <AsyncSelect
                instanceId="from-pdf-author"
                inputId="from-pdf-author-select"
                isMulti
                cacheOptions
                defaultOptions
                loadOptions={loadAuthorOptions}
                onChange={handleAuthorSelectChange}
                value={selAuthors.map((a) => ({ value: a.id, label: a.name }))}
                placeholder="Autor:in suchen oder neu anlegen…"
              />
            </div>

            {/* Entrevistado/a — solo si el Beitragstyp es "Interview", igual
                que ArticleFormV2. Mismo patrón de buscador que Autor:in. */}
            {isInterview && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Gesprächspartner:in
                </label>
                <AsyncSelect
                  instanceId="from-pdf-interviewee"
                  inputId="from-pdf-interviewee-select"
                  isMulti
                  cacheOptions
                  defaultOptions
                  loadOptions={loadIntervieweeOptions}
                  onChange={handleIntervieweeSelectChange}
                  value={selInterviewees}
                  placeholder="Gesprächspartner:in suchen oder neu anlegen…"
                />
              </div>
            )}

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

            {/* onFocus (bubbling desde el contenteditable de Quill) marca este
                campo como destino del "Textbereich" del PDF, igual que Vorspann. */}
            <div onFocus={() => { activeFieldRef.current = "additionalInfo"; }}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Zusatzinfo
              </label>
              <QuillEditor value={additionalInfo} onChange={setAdditionalInfo} />
            </div>

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

            {/* Cuerpo (Fließtext) — último paso: se edita en el publilab con el PDF al lado */}
            <div>
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <label className="text-xs font-medium text-gray-500">
                  Fließtext <span className="text-[#BD0E0D]">*</span>
                </label>
                {hasBody && (
                  <button
                    type="button"
                    onClick={() => {
                      setContent("");
                      setContentHtml("");
                      setPublilabOn(false);
                    }}
                    className="text-xs px-2 py-0.5 border border-gray-300 text-gray-500 hover:border-gray-500"
                  >
                    leeren
                  </button>
                )}
              </div>

              {hasBody ? (
                <div className="border border-gray-200 bg-white">
                  <div
                    className="article-content px-3 py-2 max-h-56 overflow-auto text-sm text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: bodyPreviewHtml }}
                  />
                  <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">
                      {bodyTextLen} Zeichen
                    </span>
                    <button
                      type="button"
                      onClick={openBodyFullscreen}
                      disabled={!pdfDoc}
                      className="text-xs px-3 py-1 bg-[#BD0E0D] text-white hover:bg-[#a50c0b] transition-colors disabled:opacity-40"
                    >
                      ✍️ Im publilab bearbeiten
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openBodyFullscreen}
                  disabled={!pdfDoc}
                  className="w-full border-2 border-dashed border-[#BD0E0D]/40 hover:border-[#BD0E0D] hover:bg-[#BD0E0D]/[0.03] transition-colors py-6 px-4 flex flex-col items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-sm font-bold text-[#BD0E0D]">
                    ✍️ Fließtext im publilab erfassen
                  </span>
                  <span className="text-xs text-gray-500 text-center max-w-md">
                    Öffnet das PDF links und den publilab rechts: Text markieren →
                    als Absatz, Zwischentitel oder Frage einfügen · Bilder einbetten
                    · alles mit System-Formatierung.
                  </span>
                </button>
              )}
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

      {/* ── Vollbild: publilab a pantalla completa con el PDF acoplado (split) ── */}
      {bodyFullscreen && pdfDoc && (
        <InterviewEditor
          splitMode
          apiRef={editorApi}
          value={contentHtml}
          onChange={setContentHtml}
          onClose={closeBodyFullscreen}
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
          leftPanel={
            <div className="relative flex-1 flex flex-col min-h-0 bg-gray-50">
              <div className="px-3 py-1.5 border-b border-gray-200 bg-white">
                {renderPageNav(fsScrollRef)}
              </div>
              {markBar}
              <div ref={fsScrollRef} className="flex-1 overflow-auto p-3">
                {renderPageStack(pageWidth, fsScrollRef)}
              </div>
              <div className="px-3 py-1.5 border-t border-gray-200 bg-white text-xs text-gray-500 min-h-[1.6em]">
                {selectionPreview ? (
                  <>
                    Auswahl:{" "}
                    <span className="text-gray-700">
                      “{selectionPreview}
                      {selectionPreview.length >= 140 ? "…" : ""}”
                    </span>
                  </>
                ) : (
                  "Markiere Text im PDF und füge ihn rechts als Block ein."
                )}
              </div>
              {/* Controles flotantes — anclados al visualViewport (persisten con zoom) */}
              <div
                ref={floatBarRef}
                style={{
                  position: "fixed",
                  left: "50%",
                  top: "auto",
                  bottom: 20,
                  transform: "translate(-50%, -100%)",
                }}
                className="z-[10000] flex items-center gap-2 bg-white/95 backdrop-blur border border-gray-300 shadow-lg rounded-full px-2 py-1.5"
              >
                <button
                  type="button"
                  onClick={appendBodyToEditor}
                  className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
                  title="Auswahl als Block(e) anhängen"
                >
                  → Auswahl anhängen
                </button>
                <button
                  type="button"
                  onClick={appendHeadingToEditor}
                  className="text-xs px-3 py-1.5 border border-gray-800 text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                  title="Auswahl als Zwischentitel anhängen"
                >
                  → Zwischentitel
                </button>
              </div>
            </div>
          }
        />
      )}

      {/* ── Selector de dossiers del módulo Digital-ABO ─────────── */}
      {dossierPickerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setDossierPickerOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-bold text-gray-800">
                📚 Dossier aus PDF-Abo wählen
              </span>
              <button
                type="button"
                onClick={() => setDossierPickerOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              {loadingDossiers ? (
                <p className="p-6 text-sm text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
                  Dossiers werden geladen…
                </p>
              ) : dossiers.length === 0 ? (
                <p className="p-6 text-sm text-gray-500">
                  Noch keine Dossier-PDFs im Digital-Abo hochgeladen.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {dossiers.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => pickDossier(d)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-xs font-mono text-gray-400 shrink-0">
                          #{d.number}
                        </span>
                        <span className="text-sm text-gray-800">{d.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

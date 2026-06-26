// Helpers puros (sin React) para reconstruir texto seleccionado de un PDF
// renderizado con pdfjs (text-layer). Extraídos de la página from-pdf para que
// el visor de dossiers (DossierPdfPanel) y el creador de artículos compartan la
// MISMA heurística de columnas/párrafos/entretítulos. Si tocás una, vale para
// ambos consumidores.

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Limpia el texto seleccionado: de-guionado + drop-cap + juntar saltos.
export function cleanSelection(raw) {
  if (!raw) return "";
  return (
    raw
      // De-guionado de fin de línea (alemán): "Wort-\nwort" → "Wortwort".
      .replace(/([A-Za-zÄÖÜäöüß])-\s*\n\s*([a-zäöüß])/g, "$1$2")
      // Drop-cap / Initiale: una mayúscula suelta + minúscula → misma palabra.
      .replace(/(^|[\s\n])([A-ZÄÖÜ])[\s\n]+(?=[a-zäöüß])/g, "$1$2")
      .replace(/\s*\n\s*/g, " ")
      .replace(/[ \t]+/g, " ")
      .trim()
  );
}

// Línea de crédito (autor/foto) que se cuela al seleccionar el cuerpo.
export const BYLINE_RE =
  /^(von|text|fotos?|bilder?|grafik|illustration|interview)[:\s]/i;

// Limpia un nombre de autor seleccionado del PDF. Los dossiers antiguos usan
// versalitas con inicial drop-cap: "GERT EISENBÜRGER" se extrae como
// "G ERT E ISENBÜRGER" (la inicial grande es un glifo suelto + el resto en
// mayúsculas). Reconstruye y normaliza a Capitalización inicial.
export function cleanAuthorName(raw) {
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
export function stripLeadingBylines(raw) {
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
export function isHeadingLike(text) {
  if (!text || text.length > 140) return false;
  if (!/^[""'(\[]?[A-ZÄÖÜÑÁÉÍÓÚ¿]/.test(text)) return false;
  if (/:\s*$/.test(text)) return true;
  const endsWithSentence = /[a-z][.!?]\s*$/.test(text);
  const fewSentences = (text.match(/[a-z][.!?]/g) || []).length <= 1;
  return !endsWithSentence && fewSentences;
}

// Prepara una selección de cuerpo: descarta créditos, conserva los párrafos
// (líneas en blanco de la fuente) y marca entretítulos.
export function reflowBodySelection(raw) {
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
  if (!ls.length) return [];

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

// Reconstruye párrafos en orden de lectura a partir de una lista de spans
// ({ str, x, right, y, h, font }). Detecta columnas por huecos en X (gutters):
// al ordenar todo por Y se entremezclan las columnas de un artículo
// multi-columna; en cambio, agrupando por X y procesando cada columna por
// separado se respeta el orden de lectura (cada columna de arriba a abajo,
// columnas de izq. a der.).
export function paragraphsFromItems(items) {
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

// Reconstruye los párrafos de la selección NATIVA del usuario (arrastre sobre el
// text-layer). Lee los spans intersectados por el rango y los pasa por
// paragraphsFromItems. `textLayerSelector` permite scopear a un visor concreto.
export function getSelectionParagraphs(textLayerSelector = ".pdfsel-textLayer") {
  if (typeof window === "undefined") return "";
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return "";
  const range = sel.getRangeAt(0);

  const spans = Array.from(
    document.querySelectorAll(`${textLayerSelector} span`)
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

// Helpers puros (sin React) para reconstruir texto seleccionado de un PDF
// renderizado con pdfjs (text-layer): limpieza, columnas, párrafos,
// entretítulos y Modo Poema. ÚNICA copia — la usan Artikel aus PDF y el
// Dossier-PDF del editor de artículos vía components/DossierWorkbench (antes
// había una copia vieja acá y otra dentro de from-pdf/page.js, que se fueron
// separando). Si tocás una heurística, vale para las dos herramientas.

export function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Limpia el texto seleccionado: de-guionado + drop-cap + juntar saltos.
export function cleanSelection(raw) {
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
  // Corte de palabra a mitad de línea/columna (la selección terminó justo en
  // "...Zerstö-"): es la CONTINUACIÓN de un párrafo de cuerpo cortada por el
  // límite de lo que se copió, no un entretítulo — un título real nunca
  // termina en una palabra partida con guión. Sin este check, cualquier
  // selección que termine a mitad de palabra (muy común: el corte cae donde
  // cae) queda marcada como título si además tiene ≤1 oración completa
  // adentro (ver `fewSentences` abajo).
  if (/[a-zäöüß]-\s*$/.test(text)) return false;
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
  // Agrupar en líneas por baseline (Y). Tolerancia PROPORCIONAL a la altura
  // del texto (no un píxel fijo): un número fijo asume una altura de línea
  // "típica" (~12px) y con fuentes/zoom más chicos (dossiers escaneados con
  // line-height más apretado) dos líneas físicas distintas pueden caer
  // dentro de esa distancia fija y agruparse como una sola — ahí el orden
  // por X mezcla palabras de líneas distintas y el espaciado intra-línea
  // (más estricto que el salto de línea normal) se come el espacio real
  // entre ellas. min(cur.h, it.h) evita que un drop cap ya agrupado infle la
  // tolerancia. El factor 0.5 preserva el umbral de hoy en el caso ya
  // calibrado (h≈12 → 6px) y solo escala para los demás.
  const lines = [];
  let cur = null;
  for (const it of items) {
    const yTol = cur ? Math.max(3, Math.min(cur.h, it.h) * 0.5) : 0;
    if (cur && Math.abs(it.y - cur.y) <= yTol) {
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
  // Fin de artículo: limpiar el cuadradito-leído-como-"n" ACÁ, antes de
  // isHeading — si no, la puntuación final queda tapada por esa "n" suelta
  // y la última línea del párrafo se toma como título en vez de cierre.
  const lastLine = ls[ls.length - 1];
  lastLine.text = lastLine.text.replace(/([.!?])\s*n\s*$/, "$1");

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
  const out = paras.filter(Boolean);
  // Fin de artículo: muchos dossiers cierran con un cuadradito negro (■) que
  // el OCR confunde con una "n" suelta pegada al punto final ("wechseln. n").
  // Solo se quita si queda literalmente al final del texto seleccionado —
  // nunca a mitad de palabra, porque ahí sí sería una "n" real.
  const lastIdx = out.length - 1;
  if (lastIdx >= 0) {
    out[lastIdx] = out[lastIdx].replace(/([.!?])\s*n\s*$/, "$1");
  }
  return out;
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
//
// "Modo Poema": desactiva TODO lo anterior (fusión de oraciones, detección
// de títulos, separación de columnas por gutter) — para un poema cada salto
// de línea es un verso intencional, no un accidente de maquetación a
// arreglar. Solo agrupa en líneas por Y (una línea visual puede llegar
// partida en varios spans de PDF.js) y las devuelve en el orden exacto de
// arriba a abajo, izquierda a derecha. Nace del caso de un poema bilingüe a
// dos columnas donde la columna alemana está alineada a la DERECHA (ragged-
// left): eso rompe el supuesto del detector de gutter (una franja vacía
// estable), así que en vez de intentar arreglar esa detección para un layout
// tan particular, se selecciona cada columna por separado con "Textbereich"
// y se inserta en modo literal — cero ambigüedad, sin arriesgar el detector
// normal que funciona bien para el 99% del texto en prosa.
function linesFromItemsLiteral(items) {
  if (!items || !items.length) return "";
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const hs = sorted.map((i) => i.h).sort((a, b) => a - b);
  const medH = hs[Math.floor(hs.length / 2)] || 10;

  const lines = [];
  let current = [];
  let lastY = null;
  for (const it of sorted) {
    if (lastY == null || Math.abs(it.y - lastY) < medH * 0.5) {
      current.push(it);
    } else {
      if (current.length) lines.push(current);
      current = [it];
    }
    lastY = it.y;
  }
  if (current.length) lines.push(current);

  const rows = lines.map((line) => {
    line.sort((a, b) => a.x - b.x);
    return {
      text: line
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
      left: Math.min(...line.map((i) => i.x)),
      right: Math.max(...line.map((i) => i.right ?? i.x)),
      y: line[0].y,
    };
  });
  const colLeft = Math.min(...rows.map((r) => r.left));
  const colRight = Math.max(...rows.map((r) => r.right));

  // ¿`next` es la continuación de un verso que la maqueta cortó por falta de
  // ancho (columnas angostas del impreso), y no un verso propio? Regla
  // tipográfica: la primera palabra de `next` NO habría entrado al final de
  // `prev` (por eso bajó de línea) — y además la línea sigue en minúscula
  // (`Wenn du sie zum Weinen` / `bringst`) o `prev` corta con guion
  // (`Bräuti-` / `gams`). Los versos de verdad suelen empezar en mayúscula,
  // así que esa segunda condición es la que evita unir versos cortos.
  const isWrapped = (prev, next) => {
    if (!prev.text || !next.text) return false;
    const hyphen = /[-\u00AD\u2010]$/.test(prev.text);
    const lower = /^\p{Ll}/u.test(next.text);
    if (!hyphen && !lower) return false;
    const firstWord = next.text.split(" ")[0];
    const nextW = next.right - next.left;
    const firstWordW = (nextW * firstWord.length) / next.text.length;
    const spaceW = medH * 0.25;
    return prev.right + spaceW + firstWordW >= colLeft + (colRight - colLeft) * 0.95;
  };

  const out = [];
  let prev = null;
  for (const row of rows) {
    // Salto de línea bien más grande que lo típico = estrofa nueva en el
    // original (línea en blanco entre versos).
    const stanzaBreak = prev != null && row.y - prev.y > medH * 1.8;
    if (stanzaBreak) out.push("");
    if (!stanzaBreak && prev && out.length && isWrapped(prev, row)) {
      const last = out[out.length - 1];
      // Guion de corte + minúscula = palabra partida (`Bräuti-gams` →
      // `Bräutigams`); guion + mayúscula = compuesto (`Nord-Süd`), se deja.
      out[out.length - 1] = /[-\u00AD\u2010]$/.test(last)
        ? /^\p{Ll}/u.test(row.text)
          ? last.slice(0, -1) + row.text
          : last + row.text
        : last + " " + row.text;
    } else {
      out.push(row.text);
    }
    prev = row;
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function paragraphsFromItems(items, literal = false) {
  if (!items || !items.length) return "";
  if (literal) return linesFromItemsLiteral(items);

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

export function getSelectionParagraphs(literal = false) {
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
  return paragraphsFromItems(items, literal);
}

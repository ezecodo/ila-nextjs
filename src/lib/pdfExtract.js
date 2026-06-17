// Extracción de texto de PDFs de Dossiers (cliente, pdfjs 3.x desde CDN).
// Sin LLM: heurísticas de columnas, de-guionado y filtros de fuente/rotación/margen.
// El objetivo es que una persona pegue el resultado en el editor y corrija lo mínimo.

const MIN_HEIGHT = 10.5; // descarta pies de foto / notas al pie (fuente chica)
const TITLE_HEIGHT = 14; // a partir de acá se considera título
const MARGIN_BOTTOM = 40; // folios / números de página
const MARGIN_TOP = 30;
const LINE_TOLERANCE = 4; // px de diferencia en baseline para considerar misma línea
const COLUMN_BUCKET = 10; // ancho de bucket del histograma de inicios X
const COLUMN_PEAK_RATIO = 0.06; // un pico de columna debe tener >=6% de los ítems
const COLUMN_MERGE_DIST = 60; // picos más cercanos que esto se fusionan

function isRotated(transform) {
  return Math.abs(transform[1]) > 0.01 || Math.abs(transform[2]) > 0.01;
}

// Detecta los inicios X de columna a partir de un histograma de los ítems.
function detectColumns(items) {
  if (items.length === 0) return [0];
  const buckets = {};
  for (const it of items) {
    const b = Math.floor(it.x / COLUMN_BUCKET);
    buckets[b] = (buckets[b] || 0) + 1;
  }
  const threshold = items.length * COLUMN_PEAK_RATIO;
  const peaks = Object.entries(buckets)
    .filter(([, count]) => count >= threshold)
    .map(([b]) => Number(b) * COLUMN_BUCKET)
    .sort((a, b) => a - b);

  // Fusiona picos cercanos (un mismo borde de columna disperso en varios buckets).
  const merged = [];
  for (const x of peaks) {
    if (merged.length && x - merged[merged.length - 1] < COLUMN_MERGE_DIST) continue;
    merged.push(x);
  }
  return merged.length ? merged : [0];
}

function assignColumn(x, columnStarts) {
  let col = 0;
  for (let i = 0; i < columnStarts.length; i++) {
    if (x >= columnStarts[i] - COLUMN_MERGE_DIST / 2) col = i;
  }
  return col;
}

// Agrupa ítems (ya ordenados por Y desc) en líneas por proximidad de baseline.
// Cada línea queda con su texto, sus bordes (left/right) y su fuente dominante.
function groupLines(items) {
  const lines = [];
  let current = null;
  for (const it of items) {
    if (current && Math.abs(it.y - current.y) <= LINE_TOLERANCE) {
      current.items.push(it);
      current.height = Math.max(current.height, it.height);
    } else {
      current = { y: it.y, height: it.height, items: [it] };
      lines.push(current);
    }
  }
  // Dentro de cada línea, ordenar por X y armar el texto + métricas.
  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);
    line.text = line.items
      .map((i) => i.str)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    line.left = Math.min(...line.items.map((i) => i.x));
    line.right = Math.max(...line.items.map((i) => i.x + (i.width || 0)));
    line.font = dominantFont(line.items);
  }
  return lines.filter((l) => l.text.length > 0);
}

// Fuente predominante de un conjunto de ítems, ponderada por nº de caracteres.
function dominantFont(items) {
  const counts = {};
  for (const it of items) {
    counts[it.font] = (counts[it.font] || 0) + (it.str.length || 1);
  }
  let best = "";
  let bestN = -1;
  for (const [f, n] of Object.entries(counts)) {
    if (n > bestN) {
      bestN = n;
      best = f;
    }
  }
  return best;
}

function median(nums) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ¿La línea parece un entretítulo? Señal principal: usa una fuente distinta a
// la del cuerpo (los Zwischentitel van en negrita = otra fuente) o es más alta;
// además debe ser corta, empezar en mayúscula y no terminar como una oración.
function isHeadingLine(line, domFont, medH, colLeft, colRight) {
  const text = line.text;
  if (text.length < 3 || text.length > 110) return false;
  if (!/^["'(\[«¿¡]?[A-ZÄÖÜÑÁÉÍÓÚ0-9]/.test(text)) return false;
  // Termina como oración de cuerpo (punto / exclamación) → no es título.
  if (/[.!]["')\]]?\s*$/.test(text)) return false;
  // Señal principal: la línea va en otra fuente que el cuerpo (negrita) →
  // es entretítulo aunque sea ancho ("Trump verfügt Amnestie für …").
  const diffFont = domFont && line.font && line.font !== domFont;
  if (diffFont) return true;
  // Si no, sólo es título si es más alto que el cuerpo Y corto (no una línea
  // de cuerpo con una mayúscula inicial grande / capitular).
  const isShort = line.right < colRight - (colRight - colLeft) * 0.1;
  const tall = medH && line.height >= medH * 1.18;
  return tall && isShort;
}

// Une líneas en párrafos; detecta corte por salto vertical grande o por título.
// `domFont` es la fuente del cuerpo (las demás se tratan como entretítulos).
function linesToParagraphs(lines, domFont) {
  if (!lines.length) return [];
  const medH = median(lines.map((l) => l.height));
  const colRight = Math.max(...lines.map((l) => l.right));
  const colLeft = Math.min(...lines.map((l) => l.left));
  const gaps = [];
  for (let i = 1; i < lines.length; i++) {
    gaps.push(lines[i - 1].y - lines[i].y);
  }
  const medianGap = median(gaps.filter((g) => g > 0));
  const paragraphs = [];
  let buffer = [];
  let headBuf = [];

  const flush = () => {
    if (!buffer.length) return;
    let text = "";
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer[i];
      if (i === 0) {
        text = line;
        continue;
      }
      // De-guionado: palabra cortada a fin de línea (alemán: junta si sigue minúscula).
      if (/[A-Za-zÄÖÜäöüß]-$/.test(text) && /^[a-zäöüß]/.test(line)) {
        text = text.replace(/-$/, "") + line;
      } else {
        text += " " + line;
      }
    }
    paragraphs.push(text);
    buffer = [];
  };
  const flushHead = () => {
    if (!headBuf.length) return;
    paragraphs.push("## " + headBuf.join(" "));
    headBuf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isHeadingLine(line, domFont, medH, colLeft, colRight)) {
      flush();
      headBuf.push(line.text); // entretítulos consecutivos se unen en uno
      continue;
    }
    flushHead();
    const gapToPrev = i > 0 ? lines[i - 1].y - line.y : 0;
    if (i > 0 && medianGap > 0 && gapToPrev > medianGap * 1.6) {
      flush();
    }
    buffer.push(line.text);
  }
  flushHead();
  flush();
  return paragraphs;
}

// Recolecta los ítems de texto útiles de una página (descarta rotados, fuente
// chica, folios y cabeceras). Devuelve {items, pageHeight}.
function collectPageItems(content, pageHeight) {
  const items = [];
  for (const item of content.items) {
    if (!item.str || !item.str.trim()) continue;
    const t = item.transform;
    if (isRotated(t)) continue; // créditos de foto verticales, etc.
    const height = item.height || Math.abs(t[3]);
    if (height < MIN_HEIGHT) continue; // pies de foto / notas al pie
    const x = t[4];
    const y = t[5]; // baseline, origen abajo-izquierda
    if (y < MARGIN_BOTTOM || y > pageHeight - MARGIN_TOP) continue; // folios / cabeceras
    items.push({
      str: item.str,
      x,
      y,
      height,
      width: item.width || 0,
      font: item.fontName || "",
    });
  }
  return items;
}

// Repartir ítems por columna, armar líneas y párrafos (orden de lectura).
function itemsToParagraphs(items) {
  if (!items.length) return [];
  const domFont = dominantFont(items); // fuente del cuerpo (la más frecuente)
  const columnStarts = detectColumns(items);
  const columns = columnStarts.map(() => []);
  for (const it of items) {
    columns[assignColumn(it.x, columnStarts)].push(it);
  }
  const paragraphs = [];
  for (const col of columns) {
    col.sort((a, b) => b.y - a.y); // Y desc = arriba→abajo
    const lines = groupLines(col);
    paragraphs.push(...linesToParagraphs(lines, domFont));
  }
  return paragraphs;
}

async function extractPage(page) {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  return itemsToParagraphs(collectPageItems(content, viewport.height));
}

// Une párrafos de páginas consecutivas resolviendo el de-guionado a fin de página.
function joinAcrossPages(pagesParagraphs) {
  const all = [];
  for (const pageParas of pagesParagraphs) {
    for (const para of pageParas) {
      const last = all[all.length - 1];
      if (
        last &&
        !last.startsWith("## ") &&
        !para.startsWith("## ") &&
        /[A-Za-zÄÖÜäöüß]-$/.test(last) &&
        /^[a-zäöüß]/.test(para)
      ) {
        all[all.length - 1] = last.replace(/-$/, "") + para;
      } else {
        all.push(para);
      }
    }
  }
  return all;
}

/**
 * Extrae texto de un rango de páginas de un PDF ya cargado con pdfjs.
 * @param {object} pdfDoc - documento devuelto por pdfjs.getDocument(...).promise
 * @param {number} startPage - primera página (1-based, inclusive)
 * @param {number} endPage - última página (1-based, inclusive)
 * @returns {Promise<string>} texto extraído, párrafos separados por línea en blanco
 */
export async function extractArticleText(pdfDoc, startPage, endPage) {
  const from = Math.max(1, Math.min(startPage, endPage));
  const to = Math.min(pdfDoc.numPages, Math.max(startPage, endPage));
  const pagesParagraphs = [];
  for (let n = from; n <= to; n++) {
    const page = await pdfDoc.getPage(n);
    pagesParagraphs.push(await extractPage(page));
  }
  return joinAcrossPages(pagesParagraphs).join("\n\n");
}

/**
 * Extrae el texto comprendido entre dos anclas (inicio y fin del cuerpo),
 * respetando el orden de lectura (columnas), párrafos y entretítulos.
 * Las anclas vienen en coordenadas del PDF a escala 1, origen abajo-izquierda
 * (igual que el baseline `transform[5]`).
 * @param {object} pdfDoc
 * @param {{page:number, x:number, y:number}} start
 * @param {{page:number, x:number, y:number}} end
 * @returns {Promise<string>}
 */
export async function extractArticleTextBetween(pdfDoc, start, end) {
  if (!start || !end) return "";
  // Ordenar para que `a` sea el ancla anterior en orden de lectura.
  const [a, b] = start.page <= end.page ? [start, end] : [end, start];
  const from = Math.max(1, a.page);
  const to = Math.min(pdfDoc.numPages, b.page);

  const pagesParagraphs = [];
  for (let n = from; n <= to; n++) {
    const page = await pdfDoc.getPage(n);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    let items = collectPageItems(content, viewport.height);

    if (n === a.page || n === b.page) {
      const columnStarts = detectColumns(items);
      const colOf = (x) => assignColumn(x, columnStarts);
      const Y_TOL = 5; // px de baseline para considerar "misma línea"
      const aCol = colOf(a.x);
      const bCol = colOf(b.x);
      items = items.filter((it) => {
        if (n === a.page) {
          const c = colOf(it.x);
          if (c < aCol) return false; // columna anterior al inicio
          if (c === aCol) {
            if (it.y > a.y + Y_TOL) return false; // línea por encima del inicio
            // misma línea pero a la izquierda de la palabra de inicio
            if (Math.abs(it.y - a.y) <= Y_TOL && it.x < a.x - Y_TOL) return false;
          }
        }
        if (n === b.page) {
          const c = colOf(it.x);
          if (c > bCol) return false; // columna posterior al fin
          if (c === bCol) {
            if (it.y < b.y - Y_TOL) return false; // línea por debajo del fin
            // misma línea pero a la derecha de la palabra de fin
            if (Math.abs(it.y - b.y) <= Y_TOL && it.x > b.x + Y_TOL) return false;
          }
        }
        return true;
      });
    }
    pagesParagraphs.push(itemsToParagraphs(items));
  }
  return joinAcrossPages(pagesParagraphs).join("\n\n");
}

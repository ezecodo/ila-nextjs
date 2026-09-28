// Helpers de PDF en el navegador compartidos por las herramientas del
// dashboard que trabajan sobre los Dossier-PDF (Artikel aus PDF, Artikel ohne
// Bild). Solo cliente — usan window/document.

// Carga pdfjs desde CDN (mismo patrón que PdfReader).
export function loadPdfJs() {
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

// Recorta una región (posiblemente girada) de una página del PDF a un JPEG
// derecho. `box` va en coords PDF a escala 1 con origen ARRIBA-izquierda:
// { cx, cy, w, h, angle } — centro, tamaño y giro en grados (horario, el
// mismo sentido que CSS rotate). Re-renderiza la página a alta resolución
// (`scale`) y la rota al revés alrededor del centro del recuadro, así una
// imagen inclinada en la maqueta sale enderezada y sin el texto alrededor.
export async function cropPdfRegion(pdfDoc, pageNumber, box, scale = 3) {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const full = document.createElement("canvas");
  full.width = Math.ceil(viewport.width);
  full.height = Math.ceil(viewport.height);
  await page.render({ canvasContext: full.getContext("2d"), viewport }).promise;

  const w = Math.max(1, Math.round(box.w * scale));
  const h = Math.max(1, Math.round(box.h * scale));
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");
  // Fondo blanco: si el recuadro girado se sale de la página, esas esquinas
  // quedarían transparentes (negras en JPEG).
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  // Pixel de salida p ↔ punto de página q = centro + R(angle)·(p − centroSalida).
  ctx.translate(w / 2, h / 2);
  ctx.rotate((-(box.angle || 0) * Math.PI) / 180);
  ctx.drawImage(full, -box.cx * scale, -box.cy * scale);
  return new Promise((resolve) =>
    out.toBlob((blob) => resolve(blob), "image/jpeg", 0.92)
  );
}

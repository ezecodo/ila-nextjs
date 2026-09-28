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

// Recorta una región de una página del PDF a un JPEG. Las esquinas vienen en
// coords PDF a escala 1, origen abajo-izquierda (igual que las anclas). Re-renderiza
// la página a alta resolución (`scale`) para que el recorte salga nítido.
export async function cropPdfRegion(pdfDoc, pageNumber, a, b, scale = 3) {
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

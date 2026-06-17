"use client";

import { useState, useRef, useEffect } from "react";
import { extractArticleText } from "@/lib/pdfExtract";

// Carga pdfjs desde CDN (mismo patrón que PdfReader, evita problemas de webpack con canvas).
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

function PagePreview({ pdfDoc, pageNumber, isSelected, onClick, onZoom, width }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const pixelRatio = window.devicePixelRatio || 1;
      const scale = (width / baseViewport.width) * pixelRatio;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = width + "px";
      page.render({ canvasContext: canvas.getContext("2d"), viewport });
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber, width]);

  return (
    <div
      className={`relative shrink-0 flex flex-col items-center gap-1 p-1 border transition-colors group ${
        isSelected
          ? "border-[#BD0E0D] bg-red-50"
          : "border-gray-200 hover:border-gray-400"
      }`}
      style={{ borderRadius: 0 }}
    >
      <button type="button" onClick={onClick} className="block" aria-label={`Seite ${pageNumber} auswählen`}>
        <canvas ref={canvasRef} className="block bg-white shadow-sm" style={{ width }} />
      </button>
      <button
        type="button"
        onClick={onZoom}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/60 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        aria-label={`Seite ${pageNumber} vergrößern`}
        title="Vergrößern"
      >
        🔍
      </button>
      <span
        className={`text-xs tabular-nums ${
          isSelected ? "text-[#BD0E0D] font-bold" : "text-gray-500"
        }`}
      >
        {pageNumber}
      </span>
    </div>
  );
}

function ZoomModal({ pdfDoc, pageNumber, numPages, onClose, onNavigate }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const pixelRatio = window.devicePixelRatio || 1;
      const targetH = window.innerHeight - 120;
      const scale = (targetH / baseViewport.height) * pixelRatio;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.height = targetH + "px";
      page.render({ canvasContext: canvas.getContext("2d"), viewport });
    });
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && pageNumber > 1) onNavigate(pageNumber - 1);
      if (e.key === "ArrowRight" && pageNumber < numPages) onNavigate(pageNumber + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageNumber, numPages, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNavigate(pageNumber - 1); }}
        disabled={pageNumber <= 1}
        className="absolute left-4 text-white/60 hover:text-white text-4xl disabled:opacity-20 px-3"
        aria-label="Vorherige Seite"
      >
        ‹
      </button>
      <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <canvas ref={canvasRef} className="block bg-white shadow-2xl" />
        <span className="mt-3 text-white/70 text-sm tabular-nums">
          Seite {pageNumber} / {numPages}
        </span>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNavigate(pageNumber + 1); }}
        disabled={pageNumber >= numPages}
        className="absolute right-4 text-white/60 hover:text-white text-4xl disabled:opacity-20 px-3"
        aria-label="Nächste Seite"
      >
        ›
      </button>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
        aria-label="Schließen"
      >
        ✕
      </button>
    </div>
  );
}

export default function PdfExtractPage() {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [fromPage, setFromPage] = useState("");
  const [toPage, setToPage] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [thumbWidth, setThumbWidth] = useState(200);
  const [zoomPage, setZoomPage] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult("");
    setLoading(true);
    setFileName(file.name);
    try {
      const pdfjs = await loadPdfJs();
      const buffer = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buffer }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setFromPage("");
      setToPage("");
    } catch (err) {
      console.error("PDF load error:", err);
      setError("Das PDF konnte nicht geladen werden.");
      setPdfDoc(null);
      setNumPages(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageClick = (n) => {
    // 1er click define inicio; 2do define fin; 3ro reinicia.
    if (!fromPage || (fromPage && toPage)) {
      setFromPage(String(n));
      setToPage("");
    } else {
      const start = Number(fromPage);
      if (n < start) {
        setFromPage(String(n));
        setToPage(String(start));
      } else {
        setToPage(String(n));
      }
    }
  };

  const isPageSelected = (n) => {
    const start = Number(fromPage);
    const end = Number(toPage) || start;
    return fromPage && n >= Math.min(start, end) && n <= Math.max(start, end);
  };

  const handleExtract = async () => {
    if (!pdfDoc || !fromPage) return;
    setExtracting(true);
    setError(null);
    try {
      const start = Number(fromPage);
      const end = Number(toPage) || start;
      const text = await extractArticleText(pdfDoc, start, end);
      setResult(text);
    } catch (err) {
      console.error("Extract error:", err);
      setError("Beim Extrahieren ist ein Fehler aufgetreten.");
    } finally {
      setExtracting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4">
      <div className="h-[3px] w-16 mb-3" style={{ background: "#BD0E0D" }} />
      <h1
        className="text-2xl font-black tracking-tight text-gray-800"
        style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
      >
        PDF-Text extrahieren
      </h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Dossier-PDF hochladen, Seiten des Artikels auswählen und den Text
        extrahieren. Ohne automatische Bereinigung — bitte das Ergebnis prüfen.
      </p>

      {/* Subida */}
      <label className="inline-flex items-center gap-3 px-4 py-2 bg-gray-800 text-white text-sm font-medium cursor-pointer hover:bg-gray-700 transition-colors">
        <span>📄 PDF auswählen</span>
        <input type="file" accept="application/pdf" onChange={handleFile} className="hidden" />
      </label>
      {fileName && (
        <span className="ml-3 text-sm text-gray-600">{fileName}</span>
      )}

      {loading && (
        <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
          PDF wird geladen…
        </p>
      )}
      {error && <p className="mt-4 text-sm text-[#BD0E0D]">⚠ {error}</p>}

      {/* Previsualización de páginas */}
      {pdfDoc && numPages > 0 && (
        <>
          <div className="mt-6 mb-2 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-gray-600">
              {numPages} Seiten · Seiten anklicken, um den Bereich zu wählen ·
              🔍 zum Vergrößern
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-500">
                Größe
                <input
                  type="range"
                  min={120}
                  max={420}
                  step={20}
                  value={thumbWidth}
                  onChange={(e) => setThumbWidth(Number(e.target.value))}
                  className="accent-[#BD0E0D]"
                />
              </label>
              {fromPage && (
                <span className="text-sm font-bold text-[#BD0E0D]">
                  Auswahl: {fromPage}
                  {toPage && toPage !== fromPage ? `–${toPage}` : ""}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-3 border-y border-gray-100 py-3">
            {Array.from({ length: numPages }, (_, i) => (
              <PagePreview
                key={i}
                pdfDoc={pdfDoc}
                pageNumber={i + 1}
                width={thumbWidth}
                isSelected={isPageSelected(i + 1)}
                onClick={() => handlePageClick(i + 1)}
                onZoom={() => setZoomPage(i + 1)}
              />
            ))}
          </div>

          {/* Rango manual + extraer */}
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-xs text-gray-500">
              Von Seite
              <input
                type="number"
                min={1}
                max={numPages}
                value={fromPage}
                onChange={(e) => setFromPage(e.target.value)}
                className="mt-1 w-24 border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <label className="flex flex-col text-xs text-gray-500">
              Bis Seite
              <input
                type="number"
                min={1}
                max={numPages}
                value={toPage}
                onChange={(e) => setToPage(e.target.value)}
                className="mt-1 w-24 border border-gray-300 px-2 py-1 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={handleExtract}
              disabled={!fromPage || extracting}
              className="px-5 py-2 bg-[#BD0E0D] text-white text-sm font-medium hover:bg-[#a50c0b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {extracting ? "Extrahiere…" : "Text extrahieren"}
            </button>
          </div>
        </>
      )}

      {/* Resultado */}
      {result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Ergebnis ({result.length} Zeichen) · <code>##</code> = erkannte Titel
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="text-sm px-3 py-1 border border-gray-300 hover:border-gray-500 transition-colors"
            >
              {copied ? "✓ Kopiert" : "📋 Kopieren"}
            </button>
          </div>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full h-96 border border-gray-300 p-3 text-sm font-mono leading-relaxed focus:outline-none focus:border-[#BD0E0D]"
            spellCheck={false}
          />
        </div>
      )}

      {zoomPage && (
        <ZoomModal
          pdfDoc={pdfDoc}
          pageNumber={zoomPage}
          numPages={numPages}
          onClose={() => setZoomPage(null)}
          onNavigate={setZoomPage}
        />
      )}
    </div>
  );
}

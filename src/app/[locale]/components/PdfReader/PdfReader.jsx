"use client";

import { useState, useRef, useEffect, forwardRef } from "react";
import HTMLFlipBook from "react-pageflip";

// ── Carga pdfjs desde CDN (evita problemas de webpack con canvas nativo) ──
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

// ── Página individual ─────────────────────────────────────────────────────
const BookPage = forwardRef(function BookPage(
  { pageNumber, pdfDoc, width, height, isVisible },
  ref
) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const pixelRatio = window.devicePixelRatio || 1;
      const baseViewport = page.getViewport({ scale: 1 });
      const displayScale = width / baseViewport.width;
      // Renderizar siempre a alta resolución (mínimo 3x el tamaño visual)
      const renderScale = Math.max(displayScale * pixelRatio, displayScale * 3);
      const viewport = page.getViewport({ scale: renderScale });
      const canvas = canvasRef.current;
      // Canvas físico a alta resolución
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // Tamaño visual CSS (el display real)
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      const ctx = canvas.getContext("2d");
      page.render({ canvasContext: ctx, viewport });
    });

    return () => { cancelled = true; };
  }, [isVisible, pdfDoc, pageNumber, width]);

  return (
    <div ref={ref} className="bg-white overflow-hidden" style={{ width, height }}>
      {isVisible ? (
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      ) : (
        <div className="bg-gray-100 w-full h-full" />
      )}
    </div>
  );
});

// ── Componente principal ──────────────────────────────────────────────────
export default function PdfReader({ pdfUrl, title = "ila", onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pdfDoc, setPdfDoc] = useState(null);
  const flipBookRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!pdfUrl) return;
    setLoading(true);
    setError(null);

    loadPdfJs()
      .then((pdfjs) => pdfjs.getDocument(pdfUrl).promise)
      .then((doc) => {
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      })
      .catch((err) => {
        console.error("PDF load error:", err);
        setError("Das PDF konnte nicht geladen werden.");
        setLoading(false);
      });
  }, [pdfUrl]);

  const pageWidth = isMobile
    ? Math.min((typeof window !== "undefined" ? window.innerWidth : 400) - 32, 360)
    : Math.min(Math.floor(((typeof window !== "undefined" ? window.innerHeight : 800) - 120) / 1.414), 680);
  const pageHeight = Math.round(pageWidth * 1.414);

  const goNext = () => flipBookRef.current?.pageFlip().flipNext();
  const goPrev = () => flipBookRef.current?.pageFlip().flipPrev();

  const isPageVisible = (i) => Math.abs(i - currentPage) <= 3;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col select-none"
      style={{ background: "#0e0e0e" }}
    >
      {/* ── Franja roja superior ─────────────────────────────── */}
      <div className="h-[3px] w-full shrink-0" style={{ background: "#BD0E0D" }} />

      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 md:px-8 py-3 shrink-0"
        style={{ background: "#141414", borderBottom: "1px solid #2a2a2a" }}
      >
        {/* Logo ila */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-white font-black text-2xl tracking-tight leading-none shrink-0"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            ila
          </span>
          {title && (
            <>
              <span className="text-[#BD0E0D] text-lg leading-none shrink-0">·</span>
              <span
                className="text-gray-400 text-sm truncate"
                style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
              >
                {title}
              </span>
            </>
          )}
        </div>

        {/* Contador centrado */}
        {numPages && (
          <span
            className="text-gray-500 text-xs tabular-nums tracking-widest absolute left-1/2 -translate-x-1/2"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            {currentPage + 1} <span className="text-[#BD0E0D]">/</span> {numPages}
          </span>
        )}

        {/* Cerrar */}
        <button
          onClick={onClose}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded transition-colors"
          style={{ color: "#666" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
          aria-label="Schließen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Área del libro ──────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-white/10 border-t-[#BD0E0D] rounded-full animate-spin" />
              <span
                className="text-gray-500 text-xs tracking-widest uppercase"
                style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
              >
                Lade PDF…
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center p-8">
            <p className="text-[#BD0E0D] text-lg font-bold mb-2">⚠</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        )}

        {numPages && pdfDoc && (
          <>
            {/* Flecha izquierda */}
            <button
              onClick={goPrev}
              className="absolute left-2 md:left-6 z-10 w-9 h-9 flex items-center justify-center transition-all group"
              aria-label="Vorherige Seite"
            >
              <svg
                className="w-6 h-6 transition-colors"
                style={{ color: "#444" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#BD0E0D")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Libro */}
            <div
              style={{
                width: pageWidth,
                filter: "drop-shadow(0 8px 40px rgba(0,0,0,0.8))",
              }}
            >
              <HTMLFlipBook
                ref={flipBookRef}
                width={pageWidth}
                height={pageHeight}
                size="fixed"
                minWidth={pageWidth}
                maxWidth={pageWidth}
                minHeight={pageHeight}
                maxHeight={pageHeight}
                usePortrait={true}
                startPage={0}
                drawShadow={true}
                flippingTime={650}
                useMouseEvents={true}
                swipeDistance={30}
                showCover={false}
                mobileScrollSupport={false}
                onFlip={(e) => setCurrentPage(e.data)}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <BookPage
                    key={i}
                    pageNumber={i + 1}
                    pdfDoc={pdfDoc}
                    width={pageWidth}
                    height={pageHeight}
                    isVisible={isPageVisible(i)}
                  />
                ))}
              </HTMLFlipBook>
            </div>

            {/* Flecha derecha */}
            <button
              onClick={goNext}
              className="absolute right-2 md:right-6 z-10 w-9 h-9 flex items-center justify-center transition-all"
              aria-label="Nächste Seite"
            >
              <svg
                className="w-6 h-6 transition-colors"
                style={{ color: "#444" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#BD0E0D")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      {numPages && (
        <div
          className="shrink-0 flex items-center justify-center gap-8 py-3"
          style={{ background: "#141414", borderTop: "1px solid #2a2a2a" }}
        >
          <button
            onClick={goPrev}
            className="text-gray-600 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            ← Zurück
          </button>
          <span
            className="text-gray-600 text-xs tracking-widest"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            SEITE {currentPage + 1} VON {numPages}
          </span>
          <button
            onClick={goNext}
            className="text-gray-600 hover:text-white transition-colors text-sm"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}

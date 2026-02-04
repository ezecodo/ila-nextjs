"use client";

import { useState, useEffect, useRef } from "react";
// Importamos los componentes base de react-pdf
import { Document, Page } from "react-pdf";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
  FaDownload,
  FaSearchPlus,
  FaSearchMinus,
} from "react-icons/fa";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

export default function PdfViewer({
  pdfUrl,
  title = "Revista",
  allowDownload = true,
  locale = "de",
}) {
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isLibLoaded, setIsLibLoaded] = useState(false); // 🔥 Nuevo: Estado para el motor

  const containerRef = useRef(null);

  // 🔥 SOLUCIÓN DEL POST: Carga dinámica del motor y el worker
  useEffect(() => {
    const loadPdfJS = async () => {
      const pdfjs = await import("pdfjs-dist/build/pdf");
      // Importamos el worker desde el CDN oficial para evitar problemas de Webpack local
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setIsLibLoaded(true);
    };
    loadPdfJS();
  }, []);

  // Lógica de responsividad
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 40);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const translations = {
    de: {
      loading: "Laden...",
      page: "Seite",
      of: "von",
      download: "Herunterladen",
      error: "Fehler",
    },
    es: {
      loading: "Cargando...",
      page: "Página",
      of: "de",
      download: "Descargar",
      error: "Error",
    },
  };
  const t = translations[locale] || translations.de;

  if (!isLibLoaded)
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#BD0E0D]"></div>
        <p className="mt-4 text-sm">{t.loading}</p>
      </div>
    );

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-gray-100 dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden ${
        isFullscreen ? "fixed inset-0 z-[9999] w-screen h-screen" : "w-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-bold truncate max-w-[200px]">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
            className="p-2"
          >
            <FaSearchMinus />
          </button>
          <span className="text-xs">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(s + 0.2, 2.5))}
            className="p-2"
          >
            <FaSearchPlus />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => {
              if (!document.fullscreenElement)
                containerRef.current.requestFullscreen();
              else document.exitFullscreen();
              setIsFullscreen(!isFullscreen);
            }}
            className="p-2"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          {allowDownload && (
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = pdfUrl;
                a.download = `${title}.pdf`;
                a.click();
              }}
              className="p-2 text-[#BD0E0D]"
            >
              <FaDownload />
            </button>
          )}
        </div>
      </div>

      {/* Viewport */}
      <div
        className="flex-1 relative overflow-auto bg-gray-300 dark:bg-black flex justify-center p-4"
        style={{ height: isFullscreen ? "calc(100vh - 120px)" : "70vh" }}
      >
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/80 rounded-full shadow disabled:opacity-0"
        >
          <FaChevronLeft />
        </button>

        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
          loading={
            <div className="animate-spin h-10 w-10 border-b-2 border-[#BD0E0D]"></div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            width={containerWidth}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/80 rounded-full shadow disabled:opacity-0"
        >
          <FaChevronRight />
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {t.page} {currentPage} {t.of} {totalPages}
          </span>
          <input
            type="range"
            min="1"
            max={totalPages || 1}
            value={currentPage}
            onChange={(e) => setCurrentPage(Number(e.target.value))}
            className="flex-1 h-2 accent-[#BD0E0D]"
          />
        </div>
      </div>
    </div>
  );
}

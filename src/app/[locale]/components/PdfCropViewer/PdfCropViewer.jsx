"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { loadPdfJs, cropPdfRegion } from "@/lib/pdfCrop";
import PdfCropBox from "../PdfCropBox/PdfCropBox";

// Visor de un Dossier-PDF, página por página, para recortar imágenes con el
// recuadro girable (PdfCropBox). Lo usan "Artikel ohne Bild" y el módulo de
// imágenes de los editores de artículos (ImageGalleryManager, botón "Aus
// Dossier-PDF"). Cada recorte confirmado llega como File JPEG a onImage.
//
// Props: pdfUrl, initialPage (abre ahí), rangeFrom/rangeTo (páginas del
// artículo, para marcar "estás en su página"), onImage(file, page).

const WIDTH_MIN = 400;
const WIDTH_MAX = 1000;
const WIDTH_STEP = 80;

// El mismo PDF se reabre seguido (cerrar/abrir el modal, pasar de artículo):
// se cachea el documento por URL para no volver a descargar el dossier entero.
const docCache = new Map();
function getPdfDoc(pdfUrl) {
  if (!docCache.has(pdfUrl)) {
    const p = loadPdfJs()
      .then((pdfjs) =>
        fetch(pdfUrl)
          .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject()))
          .then((buffer) => pdfjs.getDocument({ data: buffer }).promise)
      )
      .catch((err) => {
        docCache.delete(pdfUrl); // permitir reintentar
        throw err;
      });
    docCache.set(pdfUrl, p);
  }
  return docCache.get(pdfUrl);
}

// Una página en un canvas. Arrastrar dibuja un rectángulo que, al soltar,
// queda como recuadro editable; al confirmar llama a onCrop con el recuadro
// en coords PDF (escala 1, origen arriba-izq), el formato de cropPdfRegion.
function CropPage({ pdfDoc, pageNumber, width, onCrop, busy }) {
  const canvasRef = useRef(null);
  const [dims, setDims] = useState(null); // { scale }
  const [drag, setDrag] = useState(null);
  const [boxPdf, setBoxPdf] = useState(null); // recuadro en coords PDF

  // Cambiar de página descarta el recuadro pendiente.
  useEffect(() => setBoxPdf(null), [pageNumber]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    let renderTask = null;
    pdfDoc.getPage(pageNumber).then((page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      const viewport = page.getViewport({ scale });
      const ratio = window.devicePixelRatio || 1;
      const renderViewport = page.getViewport({ scale: scale * ratio });
      const canvas = canvasRef.current;
      canvas.width = renderViewport.width;
      canvas.height = renderViewport.height;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      setDims({ scale });
      renderTask = page.render({
        canvasContext: canvas.getContext("2d"),
        viewport: renderViewport,
      });
      renderTask.promise.catch(() => {}); // cancelado al cambiar de página/zoom
    });
    // Cancelar el render viejo: si no, puede terminar de pintar después de
    // un cambio de escala (mismo gotcha que PdfReader/BookPage).
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNumber, width]);

  const localPx = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e) => {
    if (!dims) return;
    e.preventDefault();
    setBoxPdf(null); // un rectángulo nuevo reemplaza al pendiente
    const { x, y } = localPx(e);
    setDrag({ x0: x, y0: y, x1: x, y1: y });
  };
  const onMove = (e) => {
    if (!drag) return;
    const { x, y } = localPx(e);
    setDrag((d) => (d ? { ...d, x1: x, y1: y } : d));
  };
  const onUp = () => {
    if (!drag || !dims) return setDrag(null);
    const left = Math.min(drag.x0, drag.x1);
    const right = Math.max(drag.x0, drag.x1);
    const top = Math.min(drag.y0, drag.y1);
    const bottom = Math.max(drag.y0, drag.y1);
    setDrag(null);
    if (right - left < 8 || bottom - top < 8) return; // click accidental
    const s = dims.scale;
    setBoxPdf({
      cx: (left + right) / 2 / s,
      cy: (top + bottom) / 2 / s,
      w: (right - left) / s,
      h: (bottom - top) / s,
      angle: 0,
    });
  };

  const s = dims?.scale || 1;
  const boxPx = boxPdf && {
    cx: boxPdf.cx * s,
    cy: boxPdf.cy * s,
    w: boxPdf.w * s,
    h: boxPdf.h * s,
    angle: boxPdf.angle,
  };

  return (
    <div
      className="relative inline-block cursor-crosshair select-none"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
    >
      <canvas ref={canvasRef} className="block bg-white shadow-lg" />
      {boxPx && dims && (
        <PdfCropBox
          box={boxPx}
          busy={busy}
          onChange={(b) =>
            setBoxPdf({ cx: b.cx / s, cy: b.cy / s, w: b.w / s, h: b.h / s, angle: b.angle })
          }
          onConfirm={async () => {
            if (busy) return;
            await onCrop(boxPdf);
            setBoxPdf(null);
          }}
          onCancel={() => setBoxPdf(null)}
        />
      )}
      {drag && (
        <div
          className="absolute border-2 border-[#BD0E0D] bg-[#BD0E0D]/10 pointer-events-none"
          style={{
            left: Math.min(drag.x0, drag.x1),
            top: Math.min(drag.y0, drag.y1),
            width: Math.abs(drag.x1 - drag.x0),
            height: Math.abs(drag.y1 - drag.y0),
          }}
        />
      )}
    </div>
  );
}

export default function PdfCropViewer({
  pdfUrl,
  initialPage,
  rangeFrom,
  rangeTo,
  onImage,
  defaultWidth = 640,
}) {
  const t = useTranslations("pdfCropViewer");
  const [pdfDoc, setPdfDoc] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [page, setPage] = useState(Number(initialPage) || 1);
  const [width, setWidth] = useState(defaultWidth);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!pdfUrl) return;
    let cancelled = false;
    setStatus("loading");
    setPdfDoc(null);
    getPdfDoc(pdfUrl)
      .then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Otro artículo / otra página de inicio → saltar ahí.
  useEffect(() => {
    setPage(Number(initialPage) || 1);
  }, [initialPage, pdfUrl]);

  const numPages = pdfDoc?.numPages || 0;
  const from = Number(rangeFrom) || null;
  const to = Number(rangeTo) || from;
  const inRange = from && page >= from && page <= to;

  const handleCrop = async (box) => {
    setBusy(true);
    setError(null);
    try {
      const blob = await cropPdfRegion(pdfDoc, page, box);
      if (!blob) throw new Error();
      const file = new File([blob], `pdf-bild-s${page}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      await onImage(file, page);
    } catch {
      setError(t("cropError"));
    } finally {
      setBusy(false);
    }
  };

  if (status === "error") {
    return <p className="text-sm text-[#BD0E0D]">{t("pdfError")}</p>;
  }
  if (status === "loading" || !pdfDoc) {
    return <p className="text-sm text-gray-400">{t("loadingPdf")}</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="px-2 py-1 border border-gray-300 disabled:opacity-40"
          aria-label={t("prevPage")}
        >
          ←
        </button>
        <span>{t("pageOf", { page, total: numPages })}</span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(numPages, p + 1))}
          disabled={page >= numPages}
          className="px-2 py-1 border border-gray-300 disabled:opacity-40"
          aria-label={t("nextPage")}
        >
          →
        </button>
        {inRange && <span className="text-green-700">{t("inArticle")}</span>}
        <span className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setWidth((w) => Math.max(WIDTH_MIN, w - WIDTH_STEP))}
            className="px-2 py-1 border border-gray-300"
            aria-label={t("zoomOut")}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setWidth((w) => Math.min(WIDTH_MAX, w + WIDTH_STEP))}
            className="px-2 py-1 border border-gray-300"
            aria-label={t("zoomIn")}
          >
            +
          </button>
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        {busy ? t("cropping") : t("cropHint")}
      </p>
      {error && (
        <p className="text-xs text-[#BD0E0D] mb-2" role="alert">
          {error}
        </p>
      )}
      {/* pt-12: lugar para la manija de giro si el recuadro toca el borde de arriba */}
      <div className="pt-12 pb-12">
        <CropPage
          pdfDoc={pdfDoc}
          pageNumber={page}
          width={width}
          onCrop={handleCrop}
          busy={busy}
        />
      </div>
    </div>
  );
}

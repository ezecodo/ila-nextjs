"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import ImageGalleryManager from "../../../components/Articles/ImageGalleryManager/ImageGalleryManager";
import { loadPdfJs, cropPdfRegion } from "@/lib/pdfCrop";
import PdfCropBox from "../../../components/PdfCropBox/PdfCropBox";

// "Artikel ohne Bild": elegir un Dossier → lista de artículos sin imagen
// principal → al lado, la página del Dossier-PDF donde está el artículo para
// recortar la imagen de ahí, o subir el archivo (p. ej. el que manda la
// persona del layout) con el mismo ImageGalleryManager del editor normal.
//
// "Kein Bild nötig" (artículos que simplemente no llevan imagen) se guarda
// solo en este navegador (localStorage) — no hay campo en la base para eso.
const SKIP_KEY = "ila-fehlende-bilder-skip";
const WIDTH_MIN = 400;
const WIDTH_MAX = 1000;
const WIDTH_STEP = 80;

function readSkipped() {
  try {
    return new Set(JSON.parse(localStorage.getItem(SKIP_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function writeSkipped(set) {
  try {
    localStorage.setItem(SKIP_KEY, JSON.stringify([...set]));
  } catch {
    // sin storage (modo privado, etc.): el salto dura solo esta sesión
  }
}

// Una página del PDF en un canvas. Arrastrar dibuja un rectángulo que, al
// soltar, queda como recuadro editable (PdfCropBox: mover, redimensionar,
// girar); al confirmar llama a onCrop con el recuadro en coords PDF (escala 1,
// origen arriba-izq), el formato que espera cropPdfRegion.
function CropPage({ pdfDoc, pageNumber, width, onCrop, busy }) {
  const canvasRef = useRef(null);
  const [dims, setDims] = useState(null); // { scale, pageHeight }
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
      setDims({ scale, pageHeight: base.height });
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
      onMouseDown={(e) => {
        setBoxPdf(null); // un rectángulo nuevo reemplaza al pendiente
        onDown(e);
      }}
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

export default function FehlendeBilderPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslations("missingImages");

  const [editions, setEditions] = useState([]);
  const [editionId, setEditionId] = useState("");
  const [edition, setEdition] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState(null);

  const [skipped, setSkipped] = useState(() => new Set());
  const [showSkipped, setShowSkipped] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [fromPage, setFromPage] = useState("");
  const [toPage, setToPage] = useState("");
  const [pagesSaved, setPagesSaved] = useState(false);

  const [pdfjs, setPdfjs] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [width, setWidth] = useState(640);
  const [cropBusy, setCropBusy] = useState(false);

  const [gallery, setGallery] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setSkipped(readSkipped());
    loadPdfJs().then(setPdfjs).catch(() => setError(t("pdfError")));
  }, [t]);

  const loadEditions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/articles-without-images");
      if (!res.ok) throw new Error();
      setEditions(await res.json());
    } catch {
      setError(t("loadError"));
    }
  }, [t]);

  useEffect(() => {
    if (status === "authenticated") loadEditions();
  }, [status, loadEditions]);

  // Al elegir dossier: lista de artículos sin imagen + su PDF.
  useEffect(() => {
    if (!editionId) return;
    let cancelled = false;
    setLoadingList(true);
    setSelectedId(null);
    setArticles([]);
    setEdition(null);
    setPdfDoc(null);
    setError(null);
    fetch(`/api/admin/articles-without-images?editionId=${editionId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setEdition(data.edition);
        setArticles(data.articles);
      })
      .catch(() => !cancelled && setError(t("loadError")))
      .finally(() => !cancelled && setLoadingList(false));
    return () => {
      cancelled = true;
    };
  }, [editionId, t]);

  useEffect(() => {
    if (!pdfjs || !edition?.pdfUrl) return;
    let cancelled = false;
    setPdfLoading(true);
    fetch(edition.pdfUrl)
      .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject()))
      .then((buffer) => pdfjs.getDocument({ data: buffer }).promise)
      .then((doc) => !cancelled && setPdfDoc(doc))
      .catch(() => !cancelled && setError(t("pdfError")))
      .finally(() => !cancelled && setPdfLoading(false));
    return () => {
      cancelled = true;
    };
  }, [pdfjs, edition, t]);

  const visibleArticles = articles.filter(
    (a) => showSkipped || !skipped.has(a.id)
  );
  const skippedCount = articles.filter((a) => skipped.has(a.id)).length;
  const selected = articles.find((a) => a.id === selectedId) || null;

  const selectArticle = (a) => {
    setSelectedId(a.id);
    setFromPage(a.startPage ? String(a.startPage) : "");
    setToPage(a.endPage ? String(a.endPage) : "");
    setPagesSaved(false);
    setPage(a.startPage || 1);
    setGallery([]);
  };

  // Después de resolver un artículo, pasar directo al siguiente de la lista.
  const selectNextAfter = (id, remaining) => {
    const idx = visibleArticles.findIndex((a) => a.id === id);
    const next = remaining.filter((a) => showSkipped || !skipped.has(a.id))[idx];
    if (next) selectArticle(next);
    else setSelectedId(null);
  };

  const toggleSkip = (id) => {
    const nextSet = new Set(skipped);
    const wasSkipped = nextSet.has(id);
    if (wasSkipped) nextSet.delete(id);
    else nextSet.add(id);
    setSkipped(nextSet);
    writeSkipped(nextSet);
    if (!wasSkipped && !showSkipped && selectedId === id) {
      const idx = visibleArticles.findIndex((a) => a.id === id);
      const next = visibleArticles.filter((a) => a.id !== id)[idx];
      if (next) selectArticle(next);
      else setSelectedId(null);
    }
  };

  const savePages = async () => {
    if (!selected) return;
    setError(null);
    try {
      const res = await fetch(`/api/articles/${selected.id}/pages`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startPage: fromPage, endPage: toPage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setArticles((prev) =>
        prev.map((a) =>
          a.id === selected.id
            ? { ...a, startPage: data.startPage, endPage: data.endPage }
            : a
        )
      );
      setPagesSaved(true);
      if (data.startPage) setPage(data.startPage);
    } catch (err) {
      setError(err.message || t("saveError"));
    }
  };

  const handleCrop = async (box) => {
    if (!pdfDoc) return;
    setCropBusy(true);
    try {
      const blob = await cropPdfRegion(pdfDoc, page, box);
      if (!blob) throw new Error();
      const file = new File([blob], `pdf-bild-s${page}-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      setGallery((prev) => [
        ...prev,
        { file, title: "", alt: "", isCover: false, order: prev.length + 1 },
      ]);
    } catch {
      setError(t("cropError"));
    } finally {
      setCropBusy(false);
    }
  };

  const saveImages = async () => {
    if (!selected || gallery.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      for (const img of gallery) {
        const fd = new FormData();
        fd.append("file", img.file);
        if (img.title?.trim()) fd.append("title", img.title.trim());
        if (img.alt?.trim()) fd.append("alt", img.alt.trim());
        if (img.displayMode) fd.append("displayMode", img.displayMode);
        const res = await fetch(`/api/articles/${selected.id}/images`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error();
      }
      // Ya tiene imagen: sale de la lista y se pasa al siguiente.
      const remaining = articles.filter((a) => a.id !== selected.id);
      setArticles(remaining);
      setEditions((prev) =>
        prev.map((e) =>
          e.id === Number(editionId)
            ? { ...e, missingCount: Math.max(0, e.missingCount - 1) }
            : e
        )
      );
      selectNextAfter(selected.id, remaining);
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const pageLabel = (a) =>
    a.startPage
      ? a.endPage && a.endPage !== a.startPage
        ? t("pagesRange", { from: a.startPage, to: a.endPage })
        : t("pageSingle", { from: a.startPage })
      : t("noPage");

  const numPages = pdfDoc?.numPages || 0;
  const inRange =
    selected?.startPage &&
    page >= selected.startPage &&
    page <= (selected.endPage || selected.startPage);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-[1500px] mx-auto">
        <h1 className="text-2xl font-bold mb-1">{t("title")}</h1>
        <p className="text-sm text-gray-500 mb-5">{t("intro")}</p>

        <select
          value={editionId}
          onChange={(e) => setEditionId(e.target.value)}
          className="w-full md:w-[520px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#BD0E0D]"
        >
          <option value="">{t("selectDossier")}</option>
          {editions.map((e) => (
            <option key={e.id} value={e.id}>
              {t("dossierOption", {
                number: e.number,
                title: e.title,
                count: e.missingCount,
              })}
              {!e.hasPdf ? ` ${t("noPdfShort")}` : ""}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-3 text-sm text-[#BD0E0D]" role="alert">
            {error}
          </p>
        )}

        {editionId && (
          <div className="mt-6 flex flex-col lg:flex-row gap-6 items-start">
            {/* ── Lista de artículos sin imagen ── */}
            <aside className="w-full lg:w-80 shrink-0 bg-white border border-gray-200">
              <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>{t("count", { count: visibleArticles.length })}</span>
                {skippedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSkipped((v) => !v)}
                    className="underline hover:text-[#BD0E0D]"
                  >
                    {showSkipped
                      ? t("hideSkipped")
                      : t("showSkipped", { count: skippedCount })}
                  </button>
                )}
              </div>
              {loadingList ? (
                <p className="p-3 text-sm text-gray-400">{t("loading")}</p>
              ) : visibleArticles.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">{t("allDone")}</p>
              ) : (
                <ul className="max-h-[70vh] overflow-auto divide-y divide-gray-100">
                  {visibleArticles.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => selectArticle(a)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                          a.id === selectedId
                            ? "bg-[#BD0E0D]/10 border-l-4 border-[#BD0E0D]"
                            : "border-l-4 border-transparent hover:bg-gray-50"
                        } ${skipped.has(a.id) ? "opacity-50" : ""}`}
                      >
                        <span className="block font-medium leading-snug">
                          {a.title}
                        </span>
                        <span className="mt-0.5 flex gap-2 text-[11px]">
                          <span
                            className={
                              a.startPage ? "text-gray-500" : "text-amber-600 font-semibold"
                            }
                          >
                            {pageLabel(a)}
                          </span>
                          {!a.isPublished && (
                            <span className="text-gray-400">{t("unpublished")}</span>
                          )}
                          {skipped.has(a.id) && (
                            <span className="text-gray-400">{t("skippedBadge")}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            {/* ── Artículo seleccionado: PDF + imágenes ── */}
            <section className="flex-1 min-w-0 w-full">
              {!selected ? (
                <p className="text-sm text-gray-500 bg-white border border-gray-200 p-4">
                  {t("chooseArticle")}
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="bg-white border border-gray-200 p-4 flex flex-wrap items-end gap-x-6 gap-y-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold leading-snug">{selected.title}</h2>
                      <Link
                        href={`/dashboard/articles/edit/${selected.id}`}
                        target="_blank"
                        className="text-xs text-[#BD0E0D] hover:underline"
                      >
                        {t("openEditor")} ↗
                      </Link>
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="text-xs text-gray-500">
                        {t("from")}
                        <input
                          type="number"
                          min="1"
                          value={fromPage}
                          onChange={(e) => {
                            setFromPage(e.target.value);
                            setPagesSaved(false);
                          }}
                          className="block w-20 border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#BD0E0D]"
                        />
                      </label>
                      <label className="text-xs text-gray-500">
                        {t("to")}
                        <input
                          type="number"
                          min="1"
                          value={toPage}
                          onChange={(e) => {
                            setToPage(e.target.value);
                            setPagesSaved(false);
                          }}
                          className="block w-20 border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-[#BD0E0D]"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={savePages}
                        className="px-3 py-1.5 text-xs border border-gray-300 hover:border-[#BD0E0D] hover:text-[#BD0E0D]"
                      >
                        {pagesSaved ? t("pagesSaved") : t("savePages")}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSkip(selected.id)}
                      className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 hover:border-gray-500"
                      title={t("noImageNeededHint")}
                    >
                      {skipped.has(selected.id) ? t("restore") : t("noImageNeeded")}
                    </button>
                  </div>

                  <div className="flex flex-col xl:flex-row gap-4 items-start">
                    {/* Visor del PDF con recorte */}
                    <div className="bg-white border border-gray-200 p-3 min-w-0 max-w-full overflow-auto">
                      {!edition?.pdfUrl ? (
                        <p className="text-sm text-gray-500">{t("noPdf")}</p>
                      ) : pdfLoading || !pdfDoc ? (
                        <p className="text-sm text-gray-400">{t("loadingPdf")}</p>
                      ) : (
                        <>
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
                            <span>
                              {t("pageOf", { page, total: numPages })}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                              disabled={page >= numPages}
                              className="px-2 py-1 border border-gray-300 disabled:opacity-40"
                              aria-label={t("nextPage")}
                            >
                              →
                            </button>
                            {inRange && (
                              <span className="text-green-700">{t("inArticle")}</span>
                            )}
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
                            {cropBusy ? t("cropping") : t("cropHint")}
                          </p>
                          <CropPage
                            pdfDoc={pdfDoc}
                            pageNumber={page}
                            width={width}
                            onCrop={handleCrop}
                            busy={cropBusy}
                          />
                        </>
                      )}
                    </div>

                    {/* Imágenes a guardar: recortes + archivos subidos */}
                    <div className="bg-white border border-gray-200 p-3 w-full xl:w-[380px] shrink-0">
                      <ImageGalleryManager gallery={gallery} setGallery={setGallery} />
                      <button
                        type="button"
                        onClick={saveImages}
                        disabled={gallery.length === 0 || saving}
                        className="mt-3 w-full px-4 py-2 text-sm font-semibold text-white bg-[#BD0E0D] hover:bg-[#a50c0b] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving ? t("saving") : t("saveImages", { count: gallery.length })}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

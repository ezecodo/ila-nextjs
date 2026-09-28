"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import ImageGalleryManager from "../../../components/Articles/ImageGalleryManager/ImageGalleryManager";
import PdfCropViewer from "../../../components/PdfCropViewer/PdfCropViewer";

// "Artikel ohne Bild": elegir un Dossier → lista de artículos sin imagen
// principal → al lado, la página del Dossier-PDF donde está el artículo para
// recortar la imagen de ahí, o subir el archivo (p. ej. el que manda la
// persona del layout) con el mismo ImageGalleryManager del editor normal.
//
// "Kein Bild nötig" (artículos que simplemente no llevan imagen) se guarda
// solo en este navegador (localStorage) — no hay campo en la base para eso.
const SKIP_KEY = "ila-fehlende-bilder-skip";

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

  const [gallery, setGallery] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setSkipped(readSkipped());
  }, []);

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
    } catch (err) {
      setError(err.message || t("saveError"));
    }
  };

  // Cada recorte confirmado en el visor entra a la galería, igual que un archivo subido.
  const addCroppedImage = (file) =>
    setGallery((prev) => [
      ...prev,
      { file, title: "", alt: "", isCover: false, order: prev.length + 1 },
    ]);

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
                      ) : (
                        <PdfCropViewer
                          key={selected.id}
                          pdfUrl={edition.pdfUrl}
                          initialPage={selected.startPage || 1}
                          rangeFrom={selected.startPage}
                          rangeTo={selected.endPage}
                          onImage={addCroppedImage}
                        />
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

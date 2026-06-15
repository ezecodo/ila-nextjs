"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import ArticleList from "../../components/Articles/ArticleList";
import Pagination from "../../components/Pagination/Pagination";

export default function FavoriteArticlesList() {
  const t = useTranslations("user_dashboard");
  const tb = useTranslations("user_dashboard.pdf_bundle");
  const locale = useLocale();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState("grid");

  // ── Bundle selection state ─────────────────────────────────────────────────
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [allFavorites, setAllFavorites] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [bundleName, setBundleName] = useState("");
  const [includeImages, setIncludeImages] = useState(true);

  const fetchFavoriteArticles = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/articles/list?favorites=true&page=${page}&limit=5`
      );
      if (!response.ok) return;
      const data = await response.json();
      setArticles(data.articles);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("❌ Error al obtener artículos favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteArticles(currentPage);
  }, [currentPage]);

  const handleRemoveFavorite = (articleId) => {
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    setAllFavorites((prev) => prev.filter((a) => a.id !== articleId));
    if (articles.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ── Enter selection mode: load all favorites ───────────────────────────────
  const enterSelectionMode = async () => {
    setSelectionMode(true);
    setSelectedIds([]);
    if (allFavorites.length > 0) return;
    try {
      setLoadingAll(true);
      const res = await fetch(
        `/api/articles/list?favorites=true&limit=100&locale=${locale}`
      );
      const data = await res.json();
      setAllFavorites(data.articles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAll(false);
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === allFavorites.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFavorites.map((a) => a.id));
    }
  };

  // ── Pre-fetch image via server proxy → base64 ─────────────────────────────
  const fetchBase64 = async (url) => {
    if (!url) return null;
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) return null;
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // ── Open naming modal before generating ────────────────────────────────────
  const openNameModal = () => {
    if (selectedIds.length === 0) return;
    setBundleName("");
    setNameModalOpen(true);
  };

  const closeNameModal = () => {
    if (generating) return;
    setNameModalOpen(false);
  };

  // ── Generate and download PDF bundle ──────────────────────────────────────
  const handleDownload = async () => {
    if (selectedIds.length === 0) return;
    setGenerating(true);
    try {
      // 1. Fetch full content
      const res = await fetch(
        `/api/articles/batch?ids=${selectedIds.join(",")}`
      );
      const articlesWithContent = await res.json();

      // 2. Preserve selection order
      const ordered = selectedIds
        .map((id) => articlesWithContent.find((a) => a.id === id))
        .filter(Boolean);

      // 3. Collect all image URLs to pre-fetch (solo si se incluyen imágenes)
      const imageCache = {};
      if (includeImages) {
        const allUrls = new Set();
        ordered.forEach((a) => {
          if (a.images?.[0]?.url) allUrls.add(a.images[0].url);
          // Inline images in the relevant content
          const html = locale === "es" ? (a.contentES || a.content || "") : (a.content || "");
          const matches = html.matchAll(/<img[^>]+src="([^"]+)"/g);
          for (const m of matches) allUrls.add(m[1]);
        });

        // 4. Fetch all images as base64 in parallel
        await Promise.all(
          [...allUrls].map(async (url) => {
            const b64 = await fetchBase64(url);
            if (b64) imageCache[url] = b64;
          })
        );
      }

      // 5. Replace URLs with base64 + pick correct locale content
      const isES = locale === "es";
      const articlesReady = ordered.map((a) => {
        const content = isES ? (a.contentES || a.content || "") : (a.content || "");
        const title = isES ? (a.titleES || a.title) : a.title;
        const subtitle = isES ? (a.subtitleES || a.subtitle) : a.subtitle;

        return {
          ...a,
          title,
          subtitle,
          content: content.replace(
            /<img([^>]+)src="([^"]+)"/g,
            (m, pre, src) =>
              imageCache[src] ? `<img${pre}src="${imageCache[src]}"` : m
          ),
          images: a.images?.map((img) => {
            const alt = (isES && img.altES) || img.alt || "";
            const titleTxt = (isES && img.titleES) || img.title || "";
            return {
              ...img,
              url: imageCache[img.url] || img.url,
              displayAlt: alt,
              displayTitle: titleTxt,
            };
          }),
        };
      });

      // 6. Dynamic import + generate PDF
      const [{ pdf }, { ArticleBundleDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ArticleBundlePdf"),
      ]);

      const trimmedName = bundleName.trim();
      const blob = await pdf(
        <ArticleBundleDocument
          articles={articlesReady}
          locale={locale}
          customTitle={trimmedName || undefined}
          includeImages={includeImages}
        />
      ).toBlob();

      const safeName = trimmedName
        ? trimmedName.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80)
        : `ila-artikel-${new Date().toISOString().slice(0, 10)}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setNameModalOpen(false);
      // Volver a la lista normal de favoritos tras generar el PDF
      exitSelectionMode();
    } catch (err) {
      console.error("❌ Error generando PDF:", err);
    } finally {
      setGenerating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t("favorites_heading")}</h2>
        <div className="flex items-center gap-2">
          {/* Toggle grilla / lista */}
          <div className="flex items-center border border-gray-300 rounded-none overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label={tb("view_grid")}
              title={tb("view_grid")}
              className={`flex items-center justify-center w-8 h-8 transition-colors ${
                viewMode === "grid"
                  ? "bg-[#BD0E0D] text-white"
                  : "text-gray-500 hover:text-[#BD0E0D]"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5h6v6H4V5zM14 5h6v6h-6V5zM4 15h6v4H4v-4zM14 13h6v6h-6v-6z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label={tb("view_list")}
              title={tb("view_list")}
              className={`flex items-center justify-center w-8 h-8 transition-colors ${
                viewMode === "list"
                  ? "bg-[#BD0E0D] text-white"
                  : "text-gray-500 hover:text-[#BD0E0D]"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {!selectionMode ? (
            <button
              onClick={enterSelectionMode}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-[#BD0E0D] hover:text-[#BD0E0D] transition-colors"
            >
              {tb("create_button")}
            </button>
          ) : (
            <button
              onClick={exitSelectionMode}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              {tb("cancel")}
            </button>
          )}
        </div>
      </div>

      {/* Normal list mode */}
      {!selectionMode && (
        <>
          {loading ? (
            <p>Cargando...</p>
          ) : articles.length > 0 ? (
            <>
              <ArticleList
                articlesProp={articles}
                view={viewMode}
                onRemoveFavorite={handleRemoveFavorite}
              />
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          ) : (
            <p>{tb("empty")}</p>
          )}
        </>
      )}

      {/* Selection mode */}
      {selectionMode && (
        <div>
          {loadingAll ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
              {tb("loading")}
            </div>
          ) : allFavorites.length === 0 ? (
            <p className="text-gray-400 text-sm">{tb("empty")}</p>
          ) : (
            <>
              {/* Banner de ayuda: cómo seleccionar y orden */}
              <div className="flex items-start gap-3 mb-4 border-l-4 border-[#BD0E0D] bg-red-50 px-4 py-3">
                <span className="shrink-0 flex h-7 w-7 items-center justify-center bg-[#BD0E0D] text-white text-xs font-bold tabular-nums shadow-sm">
                  1·2
                </span>
                <p className="text-sm text-gray-700 leading-snug">{tb("hint")}</p>
              </div>

              {/* Select all toggle */}
              <button
                onClick={toggleSelectAll}
                className="text-xs text-gray-400 hover:text-gray-700 mb-3 transition-colors"
              >
                {selectedIds.length === allFavorites.length
                  ? tb("deselect_all")
                  : tb("select_all")}
              </button>

              {/* Grilla de cards con selección activada */}
              <ArticleList
                articlesProp={allFavorites}
                view={viewMode}
                selectionMode
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </>
          )}

          {/* Floating action bar */}
          {selectedIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
                <span className="text-sm font-medium">
                  {tb(
                    selectedIds.length === 1 ? "selected_one" : "selected_other",
                    { count: selectedIds.length }
                  )}
                </span>
                <button
                  onClick={openNameModal}
                  disabled={generating}
                  className="flex items-center gap-2 bg-[#BD0E0D] hover:bg-[#a50c0b] disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {tb("download")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Name modal */}
      {nameModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={closeNameModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {tb("name_modal_title")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {tb("name_modal_description")}
            </p>
            <input
              type="text"
              autoFocus
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !generating) handleDownload();
                if (e.key === "Escape") closeNameModal();
              }}
              placeholder={tb("name_modal_placeholder")}
              maxLength={80}
              disabled={generating}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#BD0E0D] focus:ring-1 focus:ring-[#BD0E0D] disabled:opacity-60"
            />

            {/* Incluir imágenes (ahorra tinta al imprimir) */}
            <label className="flex items-start gap-3 mt-4 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                disabled={generating}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#BD0E0D] cursor-pointer disabled:opacity-60"
              />
              <span className="text-sm text-gray-700 leading-snug">
                <span className="font-semibold">{tb("include_images_label")}</span>
                <span className="block text-xs text-gray-400">
                  {tb("include_images_hint")}
                </span>
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={closeNameModal}
                disabled={generating}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-60 transition-colors"
              >
                {tb("cancel")}
              </button>
              <button
                onClick={handleDownload}
                disabled={generating}
                className="flex items-center gap-2 bg-[#BD0E0D] hover:bg-[#a50c0b] disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              >
                {generating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {tb("generating")}
                  </>
                ) : (
                  tb("name_modal_confirm")
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

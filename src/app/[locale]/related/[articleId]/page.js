"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import FavoriteButton from "../../components/FavoriteButton/FavoriteButton";
import YearTimeline from "../../components/RelatedArticles/YearTimeline";

const PAGE_SIZE = 24;

export default function RelatedAllPage() {
  const params = useParams();
  const articleId = parseInt(params.articleId, 10);
  const locale = useLocale();
  const isES = locale === "es";
  const t = useTranslations("relatedArticles");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  // range = null → todos los años; { from, to } → rango acotado por la timeline.
  const [range, setRange] = useState(null);
  // Facetas activas (chips). null = sin inicializar → la API usa todas las del
  // artículo. Una vez que llega `source`, se inicializan con todas activas.
  const [activeRegions, setActiveRegions] = useState(null);
  const [activeTopics, setActiveTopics] = useState(null);
  const [activeAuthors, setActiveAuthors] = useState(null);
  const initialized = activeRegions !== null;

  useEffect(() => {
    if (!articleId) return;
    let aborted = false;
    const qs = new URLSearchParams({
      articleId: String(articleId),
      locale,
      all: "true",
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (range) {
      qs.set("yearFrom", String(range.from));
      qs.set("yearTo", String(range.to));
    }
    if (initialized) {
      qs.set("facets", "1");
      qs.set("regions", [...activeRegions].join(","));
      qs.set("topics", [...activeTopics].join(","));
      qs.set("authors", [...activeAuthors].join(","));
    }

    // Debounce: arrastrar la timeline dispara muchos cambios de range; esperamos
    // a que el usuario suelte antes de pegarle a la API.
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/articles/related?${qs.toString()}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          if (!aborted) {
            setData(json);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!aborted) setLoading(false);
        });
    }, 300);

    return () => {
      aborted = true;
      clearTimeout(timer);
    };
  }, [articleId, locale, page, range, initialized, activeRegions, activeTopics, activeAuthors]);

  // Inicializar las facetas con todas activas cuando llega el artículo origen.
  useEffect(() => {
    if (activeRegions === null && data?.source) {
      setActiveRegions(new Set(data.source.regions.map((r) => r.id)));
      setActiveTopics(new Set(data.source.topics.map((tp) => tp.id)));
      setActiveAuthors(new Set(data.source.authors.map((a) => a.id)));
    }
  }, [data, activeRegions]);

  const items = data?.items || [];
  const total = data?.total || 0;
  const yearCounts = data?.yearCounts || [];
  const source = data?.source || null;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const minYear = yearCounts[0]?.year;
  const maxYear = yearCounts[yearCounts.length - 1]?.year;
  const displayFrom = range?.from ?? minYear;
  const displayTo = range?.to ?? maxYear;

  // Al cambiar las facetas el conjunto de años disponibles puede achicarse.
  // Mantenemos el segmento marcado, pero lo recortamos al nuevo rango; si ya no
  // intersecta (p. ej. el autor era el único que aportaba esos años) lo limpiamos.
  useEffect(() => {
    if (!range || minYear == null || maxYear == null) return;
    const from = Math.max(range.from, minYear);
    const to = Math.min(range.to, maxYear);
    if (from > to || (from <= minYear && to >= maxYear)) setRange(null);
    else if (from !== range.from || to !== range.to) setRange({ from, to });
  }, [minYear, maxYear, range]);

  const sourceTitle =
    source && isES && source.isTranslatedES && source.titleES
      ? source.titleES
      : source?.title;

  const onTimelineChange = (from, to) => {
    if (from <= minYear && to >= maxYear) setRange(null);
    else setRange({ from, to });
    setPage(1);
  };

  const resetRange = () => {
    setRange(null);
    setPage(1);
  };

  const toggleFacet = (setter) => (id) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Conservamos el segmento de años marcado para comparar resultados con/sin
    // una faceta. Si tras el cambio el segmento queda fuera del nuevo rango, el
    // efecto de clamp de abajo lo ajusta.
    setPage(1);
  };
  const toggleRegion = toggleFacet(setActiveRegions);
  const toggleTopic = toggleFacet(setActiveTopics);
  const toggleAuthor = toggleFacet(setActiveAuthors);

  const noFacets =
    initialized &&
    activeRegions.size === 0 &&
    activeTopics.size === 0 &&
    activeAuthors.size === 0;

  const renderChips = (list, activeSet, onToggle, activeColor) =>
    list.map((item) => {
      const on = activeSet?.has(item.id);
      return (
        <button
          key={item.id}
          onClick={() => onToggle(item.id)}
          aria-pressed={on}
          className={`rounded-none border px-2.5 py-1 text-[13px] transition-colors ${
            on
              ? activeColor
              : "border-gray-300 text-gray-400 line-through dark:border-gray-600 dark:text-gray-500"
          }`}
        >
          {item.name}
        </button>
      );
    });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {source && (
        <Link
          href={`/${locale}${source.legacyPath}`}
          className="text-[13px] font-bold text-[#BD0E0D] hover:underline"
        >
          {t("backToArticle")}
        </Link>
      )}

      <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t("allTitle")}
      </h1>
      {sourceTitle && (
        <p className="mt-1 text-[15px] text-gray-600 dark:text-gray-300">
          {sourceTitle}
        </p>
      )}
      <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">
        {t("allSubtitle")}
      </p>

      {/* Facetas — chips activables (regiones / temas / autor) */}
      {source && (
        <div className="mt-6">
          <span className="text-[12px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("facetsTitle")}
          </span>
          <div className="mt-2 space-y-2">
            {source.regions?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-gray-400">
                  {t("groupRegions")}
                </span>
                {renderChips(
                  source.regions,
                  activeRegions,
                  toggleRegion,
                  "border-[#BD0E0D] bg-[#BD0E0D] text-white",
                )}
              </div>
            )}
            {source.topics?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-gray-400">
                  {t("groupTopics")}
                </span>
                {renderChips(
                  source.topics,
                  activeTopics,
                  toggleTopic,
                  "border-gray-800 bg-gray-800 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900",
                )}
              </div>
            )}
            {source.authors?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-gray-400">
                  {t("groupAuthors")}
                </span>
                {renderChips(
                  source.authors,
                  activeAuthors,
                  toggleAuthor,
                  "border-[#BD0E0D] bg-white text-[#BD0E0D] dark:bg-transparent",
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filtro de años — timeline con histograma */}
      <div className="mt-6 border-b border-gray-200 pb-5 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("yearFilter")}
          </span>
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                {t("resultsCount", { count: total })}
              </span>
            )}
            {range && (
              <button
                onClick={resetRange}
                className="text-[12px] font-bold text-[#BD0E0D] hover:underline"
              >
                {t("yearAll")}
              </button>
            )}
          </div>
        </div>
        <YearTimeline
          yearCounts={yearCounts}
          from={displayFrom}
          to={displayTo}
          onChange={onTimelineChange}
        />
      </div>

      {loading ? (
        <p className="py-16 text-center text-gray-500">{t("loading")}</p>
      ) : noFacets ? (
        <p className="py-16 text-center text-gray-500">{t("facetsEmpty")}</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-gray-500">{t("noResults")}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const aTitle =
              isES && a.isTranslatedES && a.titleES ? a.titleES : a.title;
            const aSubtitle =
              isES && a.isTranslatedES && a.subtitleES
                ? a.subtitleES
                : a.subtitle;
            const authorNames = a.authors?.map((au) => au.name).join(", ");
            const editionYear = a.edition?.datePublished
              ? new Date(a.edition.datePublished).getFullYear()
              : null;
            return (
              <li
                key={a.id}
                className="group relative flex flex-col border border-gray-200 transition-all duration-300 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:hover:border-gray-600"
              >
                <Link
                  href={`/${locale}${a.legacyPath}`}
                  className="absolute inset-0 z-[1]"
                  aria-label={aTitle}
                />
                {a.image?.url && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={a.image.url}
                      alt={a.image.alt || aTitle}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h2 className="text-[17px] font-bold leading-[1.25] text-balance text-gray-900 dark:text-gray-100">
                    <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-all duration-500 group-hover:bg-[length:100%_2px]">
                      {aTitle}
                    </span>
                  </h2>
                  {aSubtitle && (
                    <p className="mt-1.5 text-[13px] leading-snug text-gray-600 line-clamp-3 dark:text-gray-300">
                      {aSubtitle}
                    </p>
                  )}
                  {!a.image?.url && a.excerpt && (
                    <p className="relative mt-3 flex-1 overflow-hidden text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                      {a.excerpt}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent dark:from-[#0a0a0a]" />
                    </p>
                  )}
                  {authorNames && (
                    <p className="mt-2 min-w-0 text-[12px] text-[#BD0E0D]">
                      {authorNames}
                    </p>
                  )}
                  {a.edition?.number && (
                    <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      ila {a.edition.number}
                      {editionYear ? ` · ${editionYear}` : ""}
                    </p>
                  )}
                </div>
                <div className="absolute right-2 top-2 z-[2]">
                  <FavoriteButton articleId={a.id} variant="mini" />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1}
            className="rounded-none border border-gray-300 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-gray-600"
          >
            {t("prev")}
          </button>
          <span className="text-[13px] text-gray-500 dark:text-gray-400">
            {t("pageInfo", { page, totalPages })}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="rounded-none border border-gray-300 px-4 py-2 text-sm font-bold disabled:opacity-40 dark:border-gray-600"
          >
            {t("next")}
          </button>
        </div>
      )}
    </main>
  );
}

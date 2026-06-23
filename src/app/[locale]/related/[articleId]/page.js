"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import FavoriteButton from "../../components/FavoriteButton/FavoriteButton";

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
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  useEffect(() => {
    if (!articleId) return;
    let aborted = false;
    setLoading(true);
    const qs = new URLSearchParams({
      articleId: String(articleId),
      locale,
      all: "true",
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (yearFrom) qs.set("yearFrom", yearFrom);
    if (yearTo) qs.set("yearTo", yearTo);

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
    return () => {
      aborted = true;
    };
  }, [articleId, locale, page, yearFrom, yearTo]);

  const items = data?.items || [];
  const total = data?.total || 0;
  const years = data?.years || [];
  const source = data?.source || null;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const sourceTitle =
    source && isES && source.isTranslatedES && source.titleES
      ? source.titleES
      : source?.title;

  const onYearFrom = (v) => {
    setYearFrom(v);
    setPage(1);
  };
  const onYearTo = (v) => {
    setYearTo(v);
    setPage(1);
  };

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

      {/* Filtro de años */}
      <div className="mt-6 flex flex-wrap items-end gap-4 border-b border-gray-200 pb-5 dark:border-gray-700">
        <div className="flex flex-col">
          <label className="mb-1 text-[12px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("yearFrom")}
          </label>
          <select
            value={yearFrom}
            onChange={(e) => onYearFrom(e.target.value)}
            className="rounded-none border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">{t("yearAll")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-[12px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("yearTo")}
          </label>
          <select
            value={yearTo}
            onChange={(e) => onYearTo(e.target.value)}
            className="rounded-none border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
          >
            <option value="">{t("yearAll")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {!loading && (
          <span className="ml-auto text-[13px] text-gray-500 dark:text-gray-400">
            {t("resultsCount", { count: total })}
          </span>
        )}
      </div>

      {loading ? (
        <p className="py-16 text-center text-gray-500">{t("loading")}</p>
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

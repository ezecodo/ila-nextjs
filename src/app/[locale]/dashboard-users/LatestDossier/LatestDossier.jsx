"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LatestDossier({ locale }) {
  const [edition, setEdition] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("user_dashboard.latest_dossier");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const editionRes = await fetch("/api/editions?current=true");
        const editionData = await editionRes.json();
        if (cancelled) return;
        if (!editionData?.number) {
          setLoading(false);
          return;
        }
        setEdition(editionData);

        const articlesRes = await fetch(
          `/api/articles/edition/${editionData.number}`
        );
        const articlesData = await articlesRes.json();
        if (cancelled) return;
        setArticles(Array.isArray(articlesData) ? articlesData : []);
      } catch {
        // se muestra el estado vacío
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
        <span className="text-4xl">📭</span>
        <p className="text-gray-500 text-sm">{t("no_current")}</p>
      </div>
    );
  }

  const editionTitle =
    locale === "es" && edition.titleES ? edition.titleES : edition.title;

  return (
    <div>
      {/* Cabecera del dossier */}
      <div className="flex flex-col sm:flex-row gap-5 mb-8">
        <div className="relative w-28 sm:w-36 flex-shrink-0 aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden shadow-sm">
          {edition.coverImage ? (
            <Image
              src={edition.coverImage}
              alt={`ila ${edition.number}`}
              fill
              className="object-cover"
              sizes="144px"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: "#BD0E0D" }}
            >
              <span
                className="text-white text-2xl font-black"
                style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
              >
                ila
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs font-mono text-gray-400">
            {t("heading")} · #{edition.number}
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight mt-1">
            {editionTitle}
          </h2>
          <Link
            href={`/${locale}/editions/${edition.number}`}
            className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#BD0E0D] hover:underline"
          >
            {t("view_toc")} →
          </Link>
        </div>
      </div>

      {/* Lista de artículos */}
      {articles.length === 0 ? (
        <p className="text-gray-500 text-sm">{t("empty")}</p>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => {
            const title =
              locale === "es" && article.isTranslatedES && article.titleES
                ? article.titleES
                : article.title;
            const subtitle =
              locale === "es" && article.isTranslatedES && article.subtitleES
                ? article.subtitleES
                : article.subtitle;
            const isExclusive = article.isPublished === false;
            const authorNames = (article.authors || [])
              .map((a) => a.name)
              .filter(Boolean)
              .join(", ");
            const imageUrl = article.image?.url || null;
            const imageAlt =
              (locale === "es" && article.image?.altES) ||
              article.image?.alt ||
              title;

            return (
              <Link
                key={article.id}
                href={
                  article.legacyPath
                    ? `/${locale}${article.legacyPath}`
                    : "#"
                }
                className="group block p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-20 sm:w-24 flex-shrink-0 aspect-[4/3] rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={imageAlt}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: "#BD0E0D" }}
                      >
                        <span
                          className="text-white text-sm font-black"
                          style={{
                            fontFamily: "Futura Cyrillic, Arial, sans-serif",
                          }}
                        >
                          ila
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#BD0E0D] leading-snug">
                      {isExclusive && (
                        <span className="mr-2 inline-block rounded-none bg-[#BD0E0D] px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-white">
                          {t("exclusive_badge")}
                        </span>
                      )}
                      {title}
                    </h3>
                    {subtitle && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed mt-1">
                        {subtitle}
                      </p>
                    )}
                    {authorNames && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
                        {authorNames}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#BD0E0D] text-sm">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

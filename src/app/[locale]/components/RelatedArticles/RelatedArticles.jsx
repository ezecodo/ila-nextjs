"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import FavoriteButton from "../FavoriteButton/FavoriteButton";

// Rail de artículos relacionados (columna derecha, sticky en desktop).
// Relevancia calculada en /api/articles/related (región → temas).
export default function RelatedArticles({ articleId }) {
  const locale = useLocale();
  const isES = locale === "es";
  const t = useTranslations("relatedArticles");
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (!articleId) return;
    let aborted = false;
    fetch(`/api/articles/related?articleId=${articleId}&locale=${locale}&limit=6`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!aborted && Array.isArray(data)) setArticles(data);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, [articleId, locale]);

  if (articles.length === 0) return null;

  return (
    <aside className="mt-10 lg:mt-0" aria-label={t("title")}>
      <div className="lg:sticky lg:top-28">
        <h2 className="text-[15px] font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100 border-b-2 border-[#BD0E0D] pb-2 mb-4">
          {t("title")}
        </h2>

        <ul className="space-y-5">
          {articles.map((a) => {
            const aTitle =
              isES && a.isTranslatedES && a.titleES ? a.titleES : a.title;
            const authorNames = a.authors?.map((au) => au.name).join(", ");
            const editionYear = a.edition?.datePublished
              ? new Date(a.edition.datePublished).getFullYear()
              : null;
            return (
              <li key={a.id} className="group relative">
                <Link
                  href={`/${locale}${a.legacyPath}`}
                  className="absolute inset-0 z-[1]"
                  aria-label={aTitle}
                />
                {a.image?.url && (
                  <div className="relative w-full aspect-[16/10] mb-2 overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image
                      src={a.image.url}
                      alt={a.image.alt || aTitle}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="320px"
                    />
                  </div>
                )}
                <h3 className="text-[15px] font-bold leading-[1.25] text-balance text-gray-900 dark:text-gray-100">
                  <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
                    {aTitle}
                  </span>
                </h3>
                {authorNames && (
                  <p className="text-[13px] text-[#BD0E0D] mt-1 leading-snug">
                    {authorNames}
                  </p>
                )}
                {a.edition?.number && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    ila {a.edition.number}
                    {editionYear ? ` · ${editionYear}` : ""}
                  </p>
                )}
                <div className="absolute top-2 right-2 z-[2] bg-white/85 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm">
                  <FavoriteButton articleId={a.id} variant="compact" />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

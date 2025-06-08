"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import PreviewHover from "../../PreviewHover/PreviewHover";
import EntityBadges from "../../../components/EntityBadges/EntityBadges";
import FavoriteButton from "../../../components/FavoriteButton/FavoriteButton";
import HoverInfo from "../../../components/HoverInfo/HoverInfo";
import { Link as LocaleLink } from "@/i18n/navigation";

export default function ArticlesGrid() {
  const [articles, setArticles] = useState([]);
  const locale = useLocale();

  useEffect(() => {
    fetch(`/api/articles/list?limit=3&locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []));
  }, [locale]);

  return (
    <section className="w-full px-0 sm:px-2 py-6 sm:py-8 grid xl:grid-cols-[1fr_1px_1fr_1px_1fr] md:grid-cols-2 grid-cols-1 gap-0 border-t border-gray-200">
      {articles.map((article, index) => {
        const firstImage = article.images?.[0];
        const title =
          locale === "es" && article.isTranslatedES
            ? article.titleES
            : article.title;
        const subtitle =
          locale === "es" && article.isTranslatedES
            ? article.subtitleES
            : article.subtitle;
        const date = article.publicationDate
          ? new Date(article.publicationDate).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "short",
            })
          : null;

        return (
          <div key={article.id + "-wrapper"} className="contents">
            {/* Artículo */}
            <div className="flex flex-col px-4 xl:border-b-0">
              {/* Imagen y badges */}
              <div className="relative w-full overflow-visible z-10">
                <Link
                  href={`/articles/${article.id}`}
                  className="block overflow-hidden"
                >
                  <Image
                    src={firstImage?.url}
                    alt={firstImage?.alt || "Artículo"}
                    width={800}
                    height={400}
                    className="w-full h-[220px] sm:h-[240px] object-cover rounded-md"
                  />
                </Link>
                <div className="absolute bottom-0 left-0 w-full px-2 py-1 rounded-b-md overflow-visible z-20 bg-gradient-to-t from-white/80 via-white/60 to-transparent backdrop-blur-sm">
                  <EntityBadges
                    categories={article.categories}
                    regions={article.regions}
                    topics={article.topics}
                    context="articles"
                    disableLinks={true}
                  />
                </div>
              </div>

              {firstImage?.credit && (
                <p className="text-xs text-gray-400 mt-1">
                  {firstImage.credit}
                </p>
              )}

              <h2 className="text-xl font-extrabold font-serif mt-4 leading-snug">
                <PreviewHover
                  preview={
                    locale === "es" && article.isTranslatedES
                      ? article.previewTextES || "—"
                      : article.previewText || "—"
                  }
                >
                  <Link
                    href={`/articles/${article.id}`}
                    className="hover:underline"
                  >
                    {title}
                  </Link>
                </PreviewHover>
              </h2>

              {subtitle && (
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                  {subtitle}
                </p>
              )}

              <div className="flex justify-between items-start mt-2">
                <div className="text-xs text-gray-500 flex flex-wrap gap-x-1 items-center">
                  {date && <span>{date}</span>}

                  {article.beitragstyp?.name && (
                    <>
                      <span className="opacity-60">|</span>
                      <span>{article.beitragstyp.name}</span>
                    </>
                  )}

                  {article.authors?.length > 0 && (
                    <>
                      <span className="opacity-60">|</span>
                      <span>by</span>
                      {article.authors.map((author) => (
                        <LocaleLink
                          key={author.id}
                          href={`/authors/${author.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          <HoverInfo
                            id={author.id}
                            name={author.name}
                            entityType="authors"
                          />
                        </LocaleLink>
                      ))}
                    </>
                  )}
                </div>

                <FavoriteButton articleId={article.id} />
              </div>
            </div>

            {/* Línea vertical (desktop) */}
            {index < articles.length - 1 && (
              <div
                key={`separator-desktop-${index}`}
                className="hidden xl:flex items-stretch justify-center"
              >
                <div className="w-px bg-gray-200" />
              </div>
            )}

            {/* Línea horizontal (mobile/tablet) */}
            {index < articles.length - 1 && (
              <div
                key={`separator-mobile-${index}`}
                className="block xl:hidden w-full border-t border-gray-200 my-6"
              />
            )}
          </div>
        );
      })}
    </section>
  );
}

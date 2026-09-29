"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import EntityBadges from "../EntityBadges/EntityBadges";
import ArticleDossierCTA from "../ArticleDossierCTA/ArticleDossierCTA";
import RelatedArticles from "../RelatedArticles/RelatedArticles";

// Vista de la versión en portugués de un artículo (campos *PT, ?lang=pt),
// compartida por ausgaben/online. Las transforms de formato (headings,
// imágenes, links) son locales de cada página — por eso la página pasa el HTML
// ya procesado (`contentHtml`, `previewHtml`, `additionalInfoHtml`).
// Pies de foto: titlePT/altPT si existen; si no, los alemanes (suelen ser
// créditos/nombres, útiles igual).
export default function ArticlePortugueseView({
  article,
  contentHtml,
  previewHtml,
  additionalInfoHtml,
  languageBar,
  dateLabel,
  locale,
}) {
  const t = useTranslations("articleLanguages");
  const author = article.authors?.map((a) => a.name).join(", ");
  const cover = article.images?.[0];
  const isBook = article.beitragstyp?.name === "Buchbesprechung";
  const coverCaption = cover ? cover.altPT || cover.titlePT || cover.alt || cover.title : "";

  return (
    <article lang="pt" className="max-w-3xl mx-auto px-4 py-10">
      <p className="text-sm text-gray-400 italic mb-2">
        {dateLabel}
        {article.edition?.number ? ` · ila ${article.edition.number}` : ""}
      </p>

      <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 dark:text-white mb-4 break-words">
        {article.titlePT}
      </h1>

      {languageBar && <div className="mb-3">{languageBar}</div>}

      {article.subtitlePT && (
        <h2 className="text-lg md:text-xl font-light italic text-gray-600 dark:text-gray-300 mb-6">
          {article.subtitlePT}
        </h2>
      )}

      {author && <p className="text-sm text-gray-500 mb-6">{author}</p>}

      {cover && (
        <figure className="w-full mb-6">
          {isBook ? (
            // Tapa de libro: completa, sin recortar (suelen ser verticales).
            <div className="relative mx-auto w-48 aspect-[2/3] shadow-md">
              <Image
                src={cover.url}
                alt={cover.altPT || cover.alt || ""}
                fill
                className="object-contain"
                sizes="192px"
              />
            </div>
          ) : (
            <div className="relative w-full aspect-[3/2] overflow-hidden shadow-md">
              <Image
                src={cover.url}
                alt={cover.altPT || cover.alt || ""}
                fill
                className="object-cover"
                sizes="(max-width: 800px) 100vw, 768px"
              />
            </div>
          )}
          {coverCaption && (
            <figcaption className="text-sm italic text-gray-600 text-center mt-3">
              {coverCaption}
            </figcaption>
          )}
        </figure>
      )}

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <EntityBadges
          categories={article.categories}
          regions={article.regions}
          topics={article.topics}
          locale={locale}
        />
      </div>

      {previewHtml && (
        <div className="mb-6 border-l-4 border-red-600/80 pl-4 md:pl-5">
          <div
            className="article-content text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}

      <div
        className="article-content text-gray-700 dark:text-gray-200"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {additionalInfoHtml && (
        <div className="mt-8 mb-6 p-5 bg-gray-50 dark:bg-gray-800 border-l-4 border-red-600 rounded-r-lg shadow-sm">
          <div
            className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:hover:underline"
            dangerouslySetInnerHTML={{ __html: additionalInfoHtml }}
          />
        </div>
      )}

      {article.translatorPT && (
        <p className="text-sm text-gray-500 italic mt-10 text-right">
          {t("translatedBy", { name: article.translatorPT })}
        </p>
      )}

      {article.edition?.id && (
        <ArticleDossierCTA edition={article.edition} currentArticleId={article.id} />
      )}

      <RelatedArticles articleId={article.id} />
    </article>
  );
}

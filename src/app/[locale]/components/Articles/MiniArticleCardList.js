"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link as LocaleLink } from "@/i18n/navigation";
import EntityBadges from "../EntityBadges/EntityBadges";
import HoverInfo from "../HoverInfo/HoverInfo";
import ArticleLink from "../Articles/ArticleLink/ArticleLink";
import SmartImage from "../SmartImage/SmartImage";
import FavoriteButton from "../FavoriteButton/FavoriteButton";

const stripHTML = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// Fila estilo editorial para el modo lista (alternativa a la grilla de cards).
export default function MiniArticleCardList({
  article,
  selectionMode = false,
  selected = false,
  selectionIndex = null,
  onToggleSelect = null,
  onRemoveFavorite = null,
}) {
  const locale = useLocale();
  const t = useTranslations("article");
  const isES = locale === "es" && article.isTranslatedES;

  const primaryImage =
    article.images && article.images.length > 0
      ? article.images[0]
      : article.articleImage
        ? { url: article.articleImage, alt: article.imageAlt || "" }
        : null;
  const hasImage = Boolean(primaryImage?.url);

  const title = isES ? article.titleES : article.title;
  const subtitle = isES ? article.subtitleES : article.subtitle;

  const teaser = isES
    ? stripHTML(article.previewTextES) ||
      stripHTML(article.contentES)?.slice(0, 300) ||
      ""
    : stripHTML(article.previewText) ||
      stripHTML(article.content)?.slice(0, 300) ||
      "";

  const editionYear = article.edition?.datePublished
    ? new Date(article.edition.datePublished).getFullYear()
    : article.publicationDate
      ? new Date(article.publicationDate).getFullYear()
      : null;

  return (
    <article
      className={`group relative flex gap-4 p-3 rounded-none border bg-white dark:bg-gray-800 transition-all duration-300 ${
        selected
          ? "border-[#BD0E0D] ring-2 ring-[#BD0E0D] ring-inset"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
      }`}
    >
      {/* Overlay de selección (modo Paquete PDF) */}
      {selectionMode && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect?.(article.id);
            }}
            className="absolute inset-0 z-20 cursor-pointer"
            aria-pressed={selected}
            aria-label={title}
          />
          <div className="absolute top-2 left-2 z-30 pointer-events-none">
            <div
              className={`flex h-7 w-7 items-center justify-center border-2 text-sm font-bold tabular-nums shadow-md ${
                selected
                  ? "border-[#BD0E0D] bg-[#BD0E0D] text-white"
                  : "border-white bg-white/85 text-transparent"
              }`}
            >
              {selected ? selectionIndex : ""}
            </div>
          </div>
        </>
      )}

      {/* Miniatura */}
      {hasImage && (
        <div className="relative w-28 sm:w-40 shrink-0 self-stretch min-h-[84px] overflow-hidden">
          <SmartImage
            src={primaryImage.url}
            alt={primaryImage.alt || "Imagen del artículo"}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            faceTopBias
          />
        </div>
      )}

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <EntityBadges
            categories={article.categories}
            regions={article.regions}
            topics={article.topics}
            context="articles"
            locale={locale}
            className="[&>a]:!text-[9px] [&>a]:!px-1.5 [&>a]:!py-0.5"
          />
          <div className="shrink-0">
            <FavoriteButton
              articleId={article.id}
              variant="compact"
              onRemoved={onRemoveFavorite}
            />
          </div>
        </div>

        <h3 className="text-[17px] font-bold leading-[1.2] text-balance text-gray-900 dark:text-gray-100">
          <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
            {title}
          </span>
        </h3>

        {subtitle && (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-1">
            {subtitle}
          </p>
        )}

        {teaser && (
          <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
            {teaser}
          </p>
        )}

        <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-1.5">
          {article.authors?.length > 0 ? (
            <span className="text-[12px] text-gray-500 dark:text-gray-400 min-w-0">
              {t("by")}{" "}
              {article.authors.map((author, i) => (
                <span key={author.id}>
                  <LocaleLink
                    href={`/authors/${author.id}`}
                    className="text-[#BD0E0D] hover:underline font-semibold"
                  >
                    <HoverInfo
                      id={author.id}
                      name={author.name}
                      entityType="authors"
                    />
                  </LocaleLink>
                  {i < article.authors.length - 1 && ", "}
                </span>
              ))}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          {article.edition?.number && editionYear && (
            <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap tracking-wide tabular-nums">
              № {article.edition.number} · {editionYear}
            </span>
          )}
        </div>
      </div>

      {/* Link que cubre toda la fila */}
      <ArticleLink article={article} className="absolute inset-0 z-0">
        <span className="sr-only">{title}</span>
      </ArticleLink>
    </article>
  );
}

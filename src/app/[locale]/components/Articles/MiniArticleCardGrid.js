import { useLocale, useTranslations } from "next-intl";
import EntityBadges from "../EntityBadges/EntityBadges";
import HoverInfo from "../HoverInfo/HoverInfo";
import { Link as LocaleLink } from "@/i18n/navigation";
import ArticleLink from "../Articles/ArticleLink/ArticleLink";
import SmartImage from "../SmartImage/SmartImage";
import FavoriteButton from "../FavoriteButton/FavoriteButton";

// 🔥 NUEVA FUNCIÓN: Limpiar HTML
const stripHTML = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default function MiniArticleCardGrid({
  article,
  delay = 0,
  isTransitioning = false,
}) {
  const locale = useLocale();
  const t = useTranslations("article");
  const isES = locale === "es" && article.isTranslatedES;

  // 🔥 Soporte para artículos viejos (images[]) y nuevos (articleImage)
  const primaryImage =
    article.images && article.images.length > 0
      ? article.images[0]
      : article.articleImage
        ? {
            url: article.articleImage,
            alt: article.imageAlt || "Imagen del artículo",
          }
        : null;

  const hasImage = Boolean(primaryImage?.url);

  const subtitle = isES ? article.subtitleES : article.subtitle;

  // Vorspann fijo (con fallback al contenido limpio)
  let teaser = "";

  if (isES) {
    teaser =
      stripHTML(article.previewTextES) ||
      stripHTML(article.contentES)?.slice(0, 400) ||
      "";
  } else {
    teaser =
      stripHTML(article.previewText) ||
      stripHTML(article.content)?.slice(0, 400) ||
      "";
  }

  const editionYear = article.edition?.datePublished
    ? new Date(article.edition.datePublished).getFullYear()
    : article.publicationDate
      ? new Date(article.publicationDate).getFullYear()
      : null;

  const MetaInfo = () =>
    (article.authors?.length > 0 ||
      article.categories?.length > 0 ||
      article.edition?.number) && (
      <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-1">
        {/* Autores */}
        {article.authors?.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">{t("by")}</span>
            {article.authors.map((author, i) => (
              <span key={author.id}>
                <LocaleLink
                  href={`/authors/${author.id}`}
                  className="text-red-600 hover:underline font-medium"
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
          </div>
        )}

        {/* Separador si hay autores y categorías */}
        {article.authors?.length > 0 && article.categories?.length > 0 && (
          <span className="opacity-60">|</span>
        )}

        {/* Categorías (localizadas) */}
        {article.categories?.length > 0 && (
          <span className="text-gray-700 dark:text-gray-400">
            {article.categories.map((cat, i) => (
              <span key={cat.id}>
                {locale === "es" && cat.nameES ? cat.nameES : cat.name}
                {i < article.categories.length - 1 && ", "}
              </span>
            ))}
          </span>
        )}

        {/* Badge de edición/año */}
        {article.edition?.number && editionYear && (
          <span className="ml-auto bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            {article.edition.number}/{editionYear}
          </span>
        )}
      </div>
    );

  return (
    <div
      className={`group w-full rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-xl dark:shadow-md mb-8 transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${
        isTransitioning ? "opacity-0" : "opacity-100"
      }`}
      style={{
        transitionDelay: isTransitioning ? "0ms" : `${delay + 600}ms`,
      }}
    >
      {/* Imagen */}
      {hasImage ? (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <ArticleLink article={article}>
            <SmartImage
              src={primaryImage.url}
              alt={primaryImage.alt || "Imagen del artículo"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              faceTopBias
            />
          </ArticleLink>

          {/* Favorito en esquina superior derecha */}
          <div className="absolute top-2 right-2">
            <FavoriteButton articleId={article.id} variant="compact" />
          </div>

          {/* Themenetiketten sobre la imagen */}
          <div className="absolute bottom-0 left-0 w-full px-3 py-2 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
            <EntityBadges
              categories={article.categories}
              regions={article.regions}
              topics={article.topics}
              context="articles"
              disableLinks={true}
            />
          </div>
        </div>
      ) : (
        <div className="px-3 pt-3 flex justify-between items-start">
          <EntityBadges
            categories={article.categories}
            regions={article.regions}
            topics={article.topics}
            context="articles"
            disableLinks={true}
          />
          {/* Favorito sin imagen */}
          <FavoriteButton articleId={article.id} variant="compact" />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-1">
        {/* Título */}
        <h3 className="text-xl font-extrabold font-serif leading-snug">
          <ArticleLink article={article}>
            <span className="hover:text-red-600 transition-colors duration-200">
              {isES ? article.titleES : article.title}
            </span>
          </ArticleLink>
        </h3>

        {/* Subtítulo */}
        {subtitle && (
          <p className="font-serif text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}

        {/* Vorspann */}
        {teaser && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mt-1">
            {teaser}
          </p>
        )}

        {/* Meta info */}
        <MetaInfo />
      </div>
    </div>
  );
}

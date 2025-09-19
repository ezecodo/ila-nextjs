import { useLocale, useTranslations } from "next-intl";
import EntityBadges from "../EntityBadges/EntityBadges";
import HoverInfo from "../HoverInfo/HoverInfo";
import { Link as LocaleLink } from "@/i18n/navigation";
import ArticleLink from "../Articles/ArticleLink/ArticleLink";
import SmartImage from "../SmartImage/SmartImage";
// 🔥 NUEVA FUNCIÓN: Limpiar HTML
const stripHTML = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default function MiniArticleCardGrid({ article }) {
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
  const teaser =
    stripHTML(isES ? article.previewTextES : article.previewText) ||
    stripHTML(article.content)?.slice(0, 400) ||
    "";

  const editionYear = article.edition?.datePublished
    ? new Date(article.edition.datePublished).getFullYear()
    : article.publicationDate
      ? new Date(article.publicationDate).getFullYear()
      : null;

  const MetaInfo = () =>
    (article.authors?.length > 0 ||
      article.categories?.length > 0 ||
      article.edition?.number) && (
      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex flex-wrap items-center gap-1">
        {/* Autores */}
        {article.authors?.length > 0 && (
          <>
            <span>{t("by")}</span>
            {article.authors.map((author, i) => (
              <span key={author.id} className="flex gap-1">
                <LocaleLink
                  href={`/authors/${author.id}`}
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <HoverInfo
                    id={author.id}
                    name={author.name}
                    entityType="authors"
                  />
                </LocaleLink>
                {i < article.authors.length - 1 && <span>,</span>}
              </span>
            ))}
          </>
        )}

        {/* Separador si hay autores y categorías */}
        {article.authors?.length > 0 && article.categories?.length > 0 && (
          <span className="opacity-60">|</span>
        )}

        {/* Categorías (localizadas) */}
        {article.categories?.length > 0 && (
          <span className="text-gray-700">
            {article.categories.map((cat, i) => (
              <span key={cat.id}>
                {locale === "es" && cat.nameES ? cat.nameES : cat.name}
                {i < article.categories.length - 1 && ", "}
              </span>
            ))}
          </span>
        )}

        {/* Separador antes de edición */}
        {(article.authors?.length > 0 || article.categories?.length > 0) &&
          article.edition?.number && <span className="opacity-60">|</span>}

        {/* Nº/Año edición */}
        {article.edition?.number && editionYear && (
          <span className="text-gray-700">
            {article.edition.number}/{editionYear}
          </span>
        )}
      </div>
    );

  return (
    <div className="w-full rounded-md bg-white dark:bg-gray-800 shadow-sm dark:shadow-md">
      {/* Imagen */}
      {hasImage ? (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-t">
          <SmartImage
            src={primaryImage.url}
            alt={primaryImage.alt || "Imagen del artículo"}
            className="w-full h-full object-cover"
            faceTopBias
          />

          {/* Themenetiketten sobre la imagen */}
          <div
            className="absolute bottom-0 left-0 w-full px-2 py-1 
      bg-gradient-to-t from-white/80 via-white/60 to-transparent 
      dark:from-black/70 dark:via-black/40 backdrop-blur-sm"
          >
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
        /* Caso sin imagen → Themenetiketten arriba del título */
        <div className="px-2 pt-2">
          <EntityBadges
            categories={article.categories}
            regions={article.regions}
            topics={article.topics}
            context="articles"
            disableLinks={true}
          />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-2">
        {/* Título */}
        <h3 className="text-xl font-extrabold font-serif leading-snug flex items-center gap-2">
          <ArticleLink article={article}>
            <span className="hover:underline">
              {isES ? article.titleES : article.title}
            </span>
          </ArticleLink>
          {isES && (
            <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded-full border border-green-300">
              ES
            </span>
          )}
        </h3>

        {/* Subtítulo (pegado al título) */}
        {subtitle && (
          <p className="font-serif text-sm text-gray-500 -mt-3">{subtitle}</p>
        )}

        {/* Vorspann (siempre visible) */}
        {teaser && (
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {teaser}
          </p>
        )}

        {/* Meta info */}
        <MetaInfo />
      </div>
    </div>
  );
}

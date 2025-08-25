import { useLocale, useTranslations } from "next-intl";
import EntityBadges from "../EntityBadges/EntityBadges";
import HoverInfo from "../HoverInfo/HoverInfo";
import PreviewHover from "../PreviewHover/PreviewHover";
import { Link as LocaleLink } from "@/i18n/navigation";
import ArticleLink from "../Articles/ArticleLink/ArticleLink";
import SmartImage from "../SmartImage/SmartImage";

export default function MiniArticleCardGrid({ article }) {
  const locale = useLocale();
  const t = useTranslations("article");
  const isES = locale === "es" && article.isTranslatedES;
  const firstImage = article.images?.[0];
  const hasImage = Boolean(firstImage?.url);

  const subtitle = isES ? article.subtitleES : article.subtitle;
  const previewText =
    (isES ? article.previewTextES : article.previewText) ||
    (isES ? article.subtitleES : article.subtitle) ||
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
      <div className="text-sm text-gray-600 mt-1 flex flex-wrap items-center gap-1">
        {/* Autores */}
        {article.authors?.length > 0 && (
          <>
            <span>{t("by")}</span>
            {article.authors.map((author, i) => (
              <span key={author.id} className="flex gap-1">
                <LocaleLink
                  href={`/authors/${author.id}`}
                  className="text-blue-600 hover:underline"
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
    <div className="bg-white border shadow-sm w-full rounded-2xl overflow-hidden">
      {/* Imagen */}
      {hasImage && (
        <div className="w-full aspect-[16/9]">
          <SmartImage
            src={firstImage.url}
            alt={firstImage.alt || "Imagen del artículo"}
            className="rounded-t w-full h-full object-cover"
            faceTopBias
          />
        </div>
      )}

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-2">
        {/* Título */}
        <h3 className="text-xl font-extrabold font-serif leading-snug flex items-center gap-2">
          <PreviewHover preview={previewText || "—"}>
            <ArticleLink article={article}>
              <span className="hover:underline">
                {isES ? article.titleES : article.title}
              </span>
            </ArticleLink>
          </PreviewHover>
          {isES && (
            <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded-full border border-green-300">
              ES
            </span>
          )}
        </h3>

        {/* ---- ORDEN CONDICIONAL ---- */}
        {hasImage ? (
          <>
            {/* Con imagen: subtítulo → meta → tags (sin vorspann) */}
            {subtitle && (
              <p className="text-sm text-gray-700 leading-tight">{subtitle}</p>
            )}
            <MetaInfo />
            <div className="mt-2">
              <EntityBadges
                categories={article.categories}
                regions={article.regions}
                topics={article.topics}
                context="articles"
                locale={locale}
              />
            </div>
          </>
        ) : (
          <>
            {/* SIN imagen: subtítulo → meta → VORSPANN → tags */}
            {subtitle && (
              <p className="text-sm text-gray-700 leading-tight">{subtitle}</p>
            )}
            <MetaInfo />
            {previewText && (
              <p className="text-sm text-gray-600 line-clamp-4">
                {previewText}
              </p>
            )}
            <div className="mt-2">
              <EntityBadges
                categories={article.categories}
                regions={article.regions}
                topics={article.topics}
                context="articles"
                locale={locale}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

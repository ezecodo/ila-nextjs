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

  // Año de la edición (si existe), con fallback al publicationDate solo para el año
  const editionYear = article.edition?.datePublished
    ? new Date(article.edition.datePublished).getFullYear()
    : article.publicationDate
      ? new Date(article.publicationDate).getFullYear()
      : null;

  return (
    <div className="bg-white border shadow-sm w-full">
      {/* Imagen */}
      {firstImage && (
        <SmartImage
          src={firstImage.url}
          alt={firstImage.alt || "Imagen del artículo"}
          className="rounded-t"
          faceTopBias
        />
      )}

      {/* Contenido */}
      <div className="p-4 flex flex-col gap-1">
        {/* Título */}
        <h3 className="text-xl font-extrabold font-serif leading-snug flex items-center gap-2">
          <PreviewHover
            preview={
              isES ? article.previewTextES || "—" : article.previewText || "—"
            }
          >
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

        {/* Subtítulo */}
        {(isES ? article.subtitleES : article.subtitle) && (
          <p className="text-sm text-gray-700 leading-tight mb-1">
            {isES ? article.subtitleES : article.subtitle}
          </p>
        )}

        {/* Autores · Categorías · Nº/Año edición */}
        {(article.authors?.length > 0 ||
          article.categories?.length > 0 ||
          article.edition?.number) && (
          <div className="text-sm text-gray-600 mt-0.5 flex flex-wrap items-center gap-1">
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

            {/* Nº/Año edición — sin “Dossier” hardcoded */}
            {/* Nº/Año edición — sin bold */}
            {/* Nº/Año edición — mismo estilo que categories */}
            {article.edition?.number && editionYear && (
              <span className="text-gray-700">
                {article.edition.number}/{editionYear}
              </span>
            )}
          </div>
        )}

        {/* Badges al final */}
        <div className="mt-2">
          <EntityBadges
            categories={article.categories}
            regions={article.regions}
            topics={article.topics}
            context="articles"
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}

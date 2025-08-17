import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import EntityBadges from "../EntityBadges/EntityBadges";
import HoverInfo from "../HoverInfo/HoverInfo";
import PreviewHover from "../PreviewHover/PreviewHover";
import { Link as LocaleLink } from "@/i18n/navigation";
import ArticleLink from "../Articles/ArticleLink/ArticleLink";

export default function MiniArticleCardGrid({ article }) {
  const locale = useLocale();
  const t = useTranslations("article");
  const isES = locale === "es" && article.isTranslatedES;
  const firstImage = article.images?.[0];

  const formattedDate = article.publicationDate
    ? new Date(article.publicationDate).toLocaleDateString(
        locale === "es" ? "es-ES" : "de-DE",
        { year: "numeric", month: "numeric" }
      )
    : null;

  return (
    <div className="bg-white border shadow-sm w-full">
      {/* Imagen */}
      {firstImage && (
        <div className="relative w-full h-48">
          <Image
            src={firstImage.url}
            alt={firstImage.alt || "Imagen del artículo"}
            fill
            className="object-cover"
          />
        </div>
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

        {/* Subtítulo (sin cursiva) */}
        {(isES ? article.subtitleES : article.subtitle) && (
          <p className="text-sm text-gray-700 leading-tight mb-1">
            {isES ? article.subtitleES : article.subtitle}
          </p>
        )}

        {/* Autores + Fecha EN LA MISMA LÍNEA */}
        {(article.authors?.length > 0 || formattedDate) && (
          <div className="text-sm text-gray-600 mt-0.5 flex flex-wrap items-center gap-1">
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

            {formattedDate && (
              <>
                {article.authors?.length > 0 && (
                  <span className="opacity-60">|</span>
                )}
                <span>{formattedDate}</span>
              </>
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

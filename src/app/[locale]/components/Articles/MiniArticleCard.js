import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import EntityBadges from "../EntityBadges/EntityBadges";
import HoverInfo from "../HoverInfo/HoverInfo";
import PreviewHover from "../PreviewHover/PreviewHover";
import { Link as LocaleLink } from "@/i18n/navigation";

export default function MiniArticleCard({ article }) {
  const locale = useLocale();
  const isES = locale === "es" && article.isTranslatedES;
  const firstImage = article.images?.[0];

  const formattedDate = article.publicationDate
    ? new Date(article.publicationDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "numeric",
      })
    : null;

  return (
    <div className="flex items-start gap-3 p-3 border rounded-md bg-white shadow-sm">
      {/* Imagen */}
      {firstImage && (
        <div className="w-[80px] h-[60px] relative flex-shrink-0 rounded overflow-hidden">
          <Image
            src={firstImage.url}
            alt={firstImage.alt || "Imagen del artículo"}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Contenido */}
      <div className="flex-1">
        <EntityBadges
          categories={article.categories}
          regions={article.regions}
          topics={article.topics}
          context="articles"
        />

        <h3 className="text-sm font-semibold leading-tight mt-1 flex items-center gap-2">
          <PreviewHover
            preview={
              isES ? article.previewTextES || "—" : article.previewText || "—"
            }
          >
            <Link href={`/articles/${article.id}`} className="hover:underline">
              {isES ? article.titleES : article.title}
            </Link>
          </PreviewHover>

          {isES && (
            <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded-full border border-green-300">
              ES
            </span>
          )}
        </h3>

        {/* Meta info */}
        <div className="text-xs text-gray-600 mt-0.5 flex flex-wrap gap-1">
          {formattedDate && <span>{formattedDate}</span>}
          {article.beitragstyp && (
            <>
              <span className="opacity-60">|</span>
              <span>
                {isES && article.beitragstyp.nameES
                  ? article.beitragstyp.nameES
                  : article.beitragstyp.name}
              </span>
            </>
          )}
        </div>

        {/* Autores */}
        {article.authors?.length > 0 && (
          <div className="text-xs text-gray-600 mt-0.5 flex gap-1 flex-wrap">
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
          </div>
        )}
      </div>
    </div>
  );
}

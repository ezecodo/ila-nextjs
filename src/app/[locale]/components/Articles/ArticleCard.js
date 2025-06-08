import Image from "next/image";
import ImageModal from "../ImageModal/ImageModal";
import { useState } from "react";
import Link from "next/link";
import HoverInfo from "../HoverInfo/HoverInfo";
import EntityBadges from "../../components/EntityBadges/EntityBadges";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import { Link as LocaleLink } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import PreviewHover from "../PreviewHover/PreviewHover";

export default function ArticleCard({ article, onRemoveFavorite }) {
  const locale = useLocale();
  const isES = locale === "es" && article.isTranslatedES;

  const firstImage = article.images?.[0];
  const formattedDate = article.publicationDate
    ? new Date(article.publicationDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "numeric",
      })
    : null;

  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  const openPopup = (imageUrl) => {
    setPopupImage(imageUrl);
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setPopupImage(null);
  };

  return (
    <div className="articleCard flex flex-col lg:flex-row overflow-visible relative border border-gray-300 rounded-lg shadow bg-white transition hover:shadow-lg">
      {/* Imagen */}
      <div className="leftColumn w-full lg:w-1/3 p-3 flex flex-col items-center">
        {firstImage && (
          <div
            className="imageContainer"
            onClick={() => openPopup(firstImage.url)}
          >
            <Image
              src={firstImage.url}
              alt={firstImage.alt || "Imagen del artículo"}
              width={250}
              height={140}
              className={`articleImage ${
                firstImage.height > firstImage.width ? "verticalImage" : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="rightColumn w-full lg:w-2/3 p-4 flex flex-col justify-start">
        <EntityBadges
          categories={article.categories}
          regions={article.regions}
          topics={article.topics}
        />

        <h2 className="text-lg font-bold leading-tight mt-1 flex items-center gap-2">
          <PreviewHover
            preview={
              isES ? article.previewTextES || "—" : article.previewText || "—"
            }
          >
            <Link href={`/articles/${article.id}`} className="hover:underline">
              {isES ? article.titleES : article.title}
            </Link>
          </PreviewHover>

          {article.isTranslatedES && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-300">
              ES
            </span>
          )}
        </h2>

        {isES && article.subtitleES ? (
          <h3 className="text-sm text-gray-600 leading-tight">
            {article.subtitleES}
          </h3>
        ) : article.subtitle ? (
          <h3 className="text-sm text-gray-600 leading-tight">
            {article.subtitle}
          </h3>
        ) : null}

        <div className="articleMeta flex items-center gap-1 text-xs text-gray-500 mt-1">
          {formattedDate && <span>{formattedDate}</span>}
          {article.beitragstyp && (
            <>
              <span className="separator">|</span>
              <span>
                {isES && article.beitragstyp.nameES
                  ? article.beitragstyp.nameES
                  : article.beitragstyp.name}
              </span>
            </>
          )}
        </div>

        {article.authors?.length > 0 && (
          <div className="articleAuthors text-xs text-gray-600 mt-1 flex flex-wrap gap-1">
            <span>by</span>
            {article.authors.map((author) => (
              <LocaleLink
                key={author.id}
                href={`/authors/${author.id}`}
                className="text-blue-600 hover:underline cursor-pointer"
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

      <div className="flex justify-end self-end mt-auto">
        <FavoriteButton
          articleId={article.id}
          onRemoveFavorite={onRemoveFavorite}
        />
      </div>

      <ImageModal
        isOpen={isOpen}
        imageUrl={popupImage}
        onClose={closePopup}
        alt={firstImage?.alt}
        title={firstImage?.title}
      />
    </div>
  );
}

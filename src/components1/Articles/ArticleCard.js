import Image from "next/image";
import ImageModal from "../ImageModal/ImageModal";
import { useState } from "react";
import Link from "next/link";
import HoverInfo from "@/components/HoverInfo/HoverInfo";
import EntityBadges from "../../components/EntityBadges/EntityBadges"; // ✅ Importamos el nuevo componente
import FavoriteButton from "@/components/FavoriteButton/FavoriteButton";
import { Link as LocaleLink } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function ArticleCard({ article, onRemoveFavorite }) {
  const t = useTranslations("author");
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
    <div className="articleCard flex flex-col lg:flex-row overflow-hidden border border-gray-300 rounded-lg shadow bg-white transition hover:shadow-lg">
      {/* 🔥 COLUMNA IZQUIERDA: Imagen */}
      <div className="leftColumn w-full lg:w-1/3 p-3 flex flex-col items-center">
        {/* 🔥 Imagen */}
        {firstImage && (
          <div
            className="imageContainer"
            onClick={() => openPopup(firstImage.url)}
          >
            <Image
              src={firstImage.url}
              alt={firstImage.alt || "Imagen del artículo"}
              width={250}
              height={140} // 🔥 MISMO TAMAÑO PARA TODAS
              className={`articleImage ${
                firstImage.height > firstImage.width ? "verticalImage" : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* 🔥 COLUMNA DERECHA: Badges + Contenido */}
      <div className="rightColumn w-full lg:w-2/3 p-4 flex flex-col justify-start">
        {/* 🔥 Usamos el componente `ArticleBadges` en lugar de badges manuales */}
        <EntityBadges
          categories={article.categories}
          regions={article.regions}
          topics={article.topics}
        />

        {/* 🔹 Título */}
        <h2 className="text-lg font-bold leading-tight mt-1">
          <Link href={`/articles/${article.id}`} className="hover:underline">
            {article.title}
          </Link>
        </h2>
        {article.subtitle && (
          <h3 className="text-sm text-gray-600 leading-tight">
            {article.subtitle}
          </h3>
        )}

        {/* 🔹 Fecha y Beitragstyp en la misma línea */}
        <div className="articleMeta flex items-center gap-1 text-xs text-gray-500 mt-1">
          {formattedDate && <span>{formattedDate}</span>}
          {article.beitragstyp?.name && (
            <>
              <span className="separator">|</span>
              <span>{article.beitragstyp.name}</span>
            </>
          )}
        </div>

        {/* 🔹 Autores compactos */}
        {article.authors?.length > 0 && (
          <div className="articleAuthors text-xs text-gray-600 mt-1 flex flex-wrap gap-1">
            <span>{t("by")}</span>
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

      {/* 🔥 Botón de favoritos en la parte inferior derecha */}
      <div className="flex justify-end self-end mt-auto">
        <FavoriteButton
          articleId={article.id}
          onRemoveFavorite={onRemoveFavorite} // ✅ Pasamos la función
        />
      </div>

      {/* 🔥 Modal de Imagen */}
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

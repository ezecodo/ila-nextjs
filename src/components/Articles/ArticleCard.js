import Image from "next/image";
import ImageModal from "../ImageModal/ImageModal";
import { useState } from "react";
import Link from "next/link";
import HoverInfo from "@/components/HoverInfo/HoverInfo";

export default function ArticleCard({ article }) {
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
        {/* 🔥 Imagen */}
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
        {/* 🔥 Badges alineados con la parte superior de la imagen */}
        <div className="badgeContainer flex flex-wrap gap-1 self-start mt-[2px]">
          {article.categories?.map((category) => (
            <Link
              key={category.id}
              href={`/entities/categories/${category.id}`}
              className="categoryBadge"
            >
              <HoverInfo
                id={category.id}
                name={category.name}
                entityType="categories"
              />
            </Link>
          ))}
          {article.regions?.map((region) => (
            <Link
              key={region.id}
              href={`/entities/regions/${region.id}`}
              className="regionBadge"
            >
              <HoverInfo
                id={region.id}
                name={region.name}
                entityType="regions"
              />
            </Link>
          ))}
          {article.topics?.map((topic) => (
            <Link
              key={topic.id}
              href={`/entities/topics/${topic.id}`}
              className="topicBadge"
            >
              <HoverInfo id={topic.id} name={topic.name} entityType="topics" />
            </Link>
          ))}
        </div>

        {/* 🔹 Título */}
        <h2 className="text-sm font-bold leading-tight mt-1">
          <Link href={`/articles/${article.id}`} className="hover:underline">
            {article.title}
          </Link>
        </h2>
        {article.subtitle && (
          <h3 className="text-xs text-gray-600 leading-tight">
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
            <span>Por:</span>
            {article.authors.map((author) => (
              <Link
                key={author.id}
                href={`/authors/${author.id}`}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                <HoverInfo
                  id={author.id}
                  name={author.name}
                  entityType="authors"
                />
              </Link>
            ))}
          </div>
        )}
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

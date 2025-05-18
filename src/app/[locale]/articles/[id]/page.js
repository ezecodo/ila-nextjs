"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import Image from "next/image";
import ImageModal from "../../components/ImageModal/ImageModal";
import Link from "next/link";
import HoverInfo from "../../components/HoverInfo/HoverInfo";
import EntityBadges from "../../components/EntityBadges/EntityBadges";
import DonationPopUp from "../../components/DonationPopUp/DonationPopUp";
import { useLocale } from "next-intl";

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const [hoveredEdition, setHoveredEdition] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState({
    url: null,
    alt: "",
    title: "",
  });

  const locale = useLocale();

  const isES = locale === "es" && article?.isTranslatedES;

  const openPopup = (image) => {
    setPopupImage({
      url: image.url,
      alt: image.alt || "Imagen del artículo",
      title: image.title || "Vista previa de la imagen",
    });
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setPopupImage({ url: null, alt: "", title: "" });
  };

  useEffect(() => {
    if (!id) return;

    async function fetchArticle() {
      try {
        const response = await fetch(`/api/articles/${id}`);
        if (!response.ok) throw new Error("Error al cargar el artículo");
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchArticle();
  }, [id]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!article) return <p>Cargando artículo...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <DonationPopUp articleId={article.id} />

      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        {isES ? article.titleES : article.title}
      </h1>

      {/* Subtítulo */}
      {(isES ? article.subtitleES : article.subtitle) && (
        <h2 className="text-xl text-gray-600 italic mb-6 text-center">
          {isES ? article.subtitleES : article.subtitle}
        </h2>
      )}

      {/* Imagen */}
      {article.images?.length > 0 && (
        <div className="flex justify-center mb-6">
          {article.images.map((image) => (
            <div
              key={image.id}
              className="relative w-full max-w-md h-64 cursor-pointer"
              onClick={() => openPopup(image)}
            >
              <Image
                src={image.url}
                alt={image.alt || "Imagen del artículo"}
                layout="fill"
                objectFit="contain"
                className="rounded-lg"
              />
            </div>
          ))}
        </div>
      )}

      {/* Etiquetas */}
      <EntityBadges
        categories={article.categories}
        regions={article.regions}
        topics={article.topics}
      />

      {/* Edición */}
      {article.edition && article.edition.id ? (
        <div className="text-gray-500 mb-4 relative flex items-center gap-2">
          <HoverInfo
            id={article.edition.id}
            name={
              <Link
                href={`/editions/${article.edition.id}`}
                className="flex items-center gap-2 no-underline hover:no-underline"
                style={{ color: "#000" }}
                onMouseEnter={(e) => {
                  setHoveredEdition(article.edition.coverImage);
                  setHoverPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseMove={(e) => {
                  setHoverPosition({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredEdition(null)}
              >
                <span
                  style={{
                    fontFamily: "Futura, sans-serif",
                    textTransform: "lowercase",
                    fontSize: "1.2em",
                    color: "#d13120",
                  }}
                >
                  ila {article.edition.number}
                </span>
                <span style={{ fontWeight: "bold", color: "#000" }}>
                  {article.edition.title}
                </span>
              </Link>
            }
            entityType="editions"
            className="text-lg font-bold"
          />
        </div>
      ) : (
        <p className="text-gray-500 mb-4">Edición no disponible</p>
      )}

      {/* Autores */}
      {article.authors?.length > 0 && (
        <div className="text-gray-700 flex items-center gap-1">
          <span>Por:</span>
          {article.authors.map((author) => (
            <HoverInfo
              key={author.id}
              id={author.id}
              name={
                <Link
                  href={`/authors/${author.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {author.name}
                </Link>
              }
              entityType="authors"
              className="text-blue-600 hover:underline"
            />
          ))}
        </div>
      )}

      {/* Contenido */}
      <div className="text-gray-700 mt-6">
        {(isES ? article.contentES : article.content)
          ? (isES ? article.contentES : article.content)
              .split("\n")
              .map((line, i) => (
                <p key={i} className="mb-4">
                  {line}
                </p>
              ))
          : "Sin contenido"}
      </div>

      {/* Información adicional */}
      {((isES && article.additionalInfoES) || article.additionalInfo) && (
        <div className="mt-6 text-sm text-gray-600 italic">
          {isES ? article.additionalInfoES : article.additionalInfo}
        </div>
      )}

      {/* Modal imagen */}
      <ImageModal
        isOpen={isOpen}
        imageUrl={popupImage.url}
        onClose={closePopup}
        alt={popupImage.alt}
        title={popupImage.title}
      />

      {/* Hover de edición */}
      {hoveredEdition && (
        <div
          className="fixed p-2 bg-white shadow-lg border rounded-lg z-50"
          style={{
            left: `${hoverPosition.x + 10}px`,
            top: `${hoverPosition.y - 260}px`,
            width: "300px",
          }}
        >
          <Image
            src={hoveredEdition}
            alt="Portada de la edición"
            width={300}
            height={350}
            className="rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

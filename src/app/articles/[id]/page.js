"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import ImageModal from "@/components/ImageModal/ImageModal";
import Link from "next/link";

export default function ArticlePage() {
  const { id } = useParams(); // Obtener el parámetro dinámico "id"
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);

  // Estado y funciones para el modal de imagen
  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState({
    url: null,
    alt: "",
    title: "",
  });

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
    setPopupImage({
      url: null,
      alt: "",
      title: "",
    });
  };

  useEffect(() => {
    if (!id) return;

    async function fetchArticle() {
      try {
        const response = await fetch(`/api/articles/${id}`);
        if (!response.ok) {
          throw new Error("Error al cargar el artículo");
        }
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchArticle();
  }, [id]);

  // Función para renderizar el contenido con estilos dinámicos
  function renderContent(content) {
    return content.split("\n").map((line, index) => {
      const trimmedLine = line.trim();

      // Detectar encabezados de sección dinámicamente
      if (/^[A-ZÄÖÜß]+[A-ZÄÖÜß\s\-]*$/.test(trimmedLine)) {
        return (
          <h3
            key={index}
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              color: "#D32F2F",
              textTransform: "uppercase",
              margin: "2rem 0 1rem",
              borderBottom: "2px solid #D32F2F",
              paddingBottom: "0.5rem",
            }}
          >
            {trimmedLine}
          </h3>
        );
      }

      // Renderizar párrafos normales
      return (
        <p
          key={index}
          style={{
            fontSize: "1rem",
            color: "#555",
            margin: "1rem 0",
            lineHeight: "1.8",
          }}
        >
          {trimmedLine}
        </p>
      );
    });
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!article) {
    return <p>Cargando artículo...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
        {article.title}
      </h1>

      {/* Subtítulo */}
      {article.subtitle && (
        <h2 className="text-xl text-gray-600 italic mb-6 text-center">
          {article.subtitle}
        </h2>
      )}

      {/* Imágenes del Artículo con Modal */}
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

      {/* Contenedor general para todas las etiquetas */}
      <div className="flex flex-wrap items-center gap-2 mt-4 mb-6">
        {/* Categorías */}
        {article.categories?.length > 0 &&
          article.categories.map((category) => (
            <span key={category.id} className="categoryBadge">
              {category.name}
            </span>
          ))}
        {/* Regiones */}
        {article.regions?.length > 0 &&
          article.regions.map((region) => (
            <span key={region.id} className="regionBadge">
              {region.name}
            </span>
          ))}

        {/* Temas */}
        {article.topics?.length > 0 &&
          article.topics.map((topic) => (
            <span key={topic.id} className="topicBadge">
              {topic.name}
            </span>
          ))}
      </div>

      {/* Edición con LINK a la página de la edición */}
      {article.edition && article.edition.id ? (
        <p className="text-gray-500 mb-4">
          <Link
            href={`/editions/${article.edition.id}`}
            className="text-blue-600 hover:underline font-bold"
            style={{ fontFamily: "Futura, sans-serif" }}
          >
            ila {article.edition.number} - {article.edition.title}
          </Link>
        </p>
      ) : (
        <p className="text-gray-500 mb-4">Edición no disponible</p>
      )}
      {/* Autor(es) */}
      {article.authors?.length > 0 && (
        <span className="text-gray-700">
          Por: {article.authors.map((author) => author.name).join(", ")}
        </span>
      )}

      {/* Contenido */}
      <div className="text-gray-700">{renderContent(article.content)}</div>

      {/* Modal de Imagen con alt y title correctos */}
      <ImageModal
        isOpen={isOpen}
        imageUrl={popupImage.url}
        onClose={closePopup}
        alt={popupImage.alt}
        title={popupImage.title}
      />
    </div>
  );
}

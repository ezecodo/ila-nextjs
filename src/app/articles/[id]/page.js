"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image"; // Para manejar imágenes de Next.js

export default function ArticlePage() {
  const { id } = useParams(); // Obtener el parámetro dinámico "id"
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);

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

      {/* Imágenes del Artículo */}
      {article.images?.length > 0 && (
        <div className="flex justify-center mb-6">
          {article.images.map((image) => (
            <div key={image.id} className="relative w-full max-w-md h-64">
              <Image
                src={image.url}
                alt={image.alt || "Imagen del artículo"}
                layout="fill"
                objectFit="contain"
                className="rounded-lg shadow-md"
              />
            </div>
          ))}
        </div>
      )}

      {/* Autor(es) */}
      {article.authors?.length > 0 && (
        <p className="text-gray-700 mb-4">
          Por: {article.authors.map((author) => author.name).join(", ")}
        </p>
      )}

      {/* Edición */}
      {article.edition && (
        <p className="text-gray-500 mb-4">
          Publicado en la edición: <strong>{article.edition.title}</strong>
        </p>
      )}

      {/* Contenido */}
      <div className="text-gray-700">{renderContent(article.content)}</div>

      {/* Regiones */}
      {article.regions?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Regiones:</h3>
          {article.regions.map((region) => (
            <span
              key={region.id}
              className="bg-red-500 text-white px-2 py-1 rounded-full text-sm mr-2"
            >
              {region.name}
            </span>
          ))}
        </div>
      )}

      {/* Temas */}
      {article.topics?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Temas:</h3>
          {article.topics.map((topic) => (
            <span
              key={topic.id}
              className="bg-green-500 text-white px-2 py-1 rounded-full text-sm mr-2"
            >
              {topic.name}
            </span>
          ))}
        </div>
      )}

      {/* Categorías */}
      {article.categories?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Categorías:</h3>
          {article.categories.map((category) => (
            <span
              key={category.id}
              className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm mr-2"
            >
              {category.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

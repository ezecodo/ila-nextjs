"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function EditionsList() {
  const [editions, setEditions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEditions() {
      try {
        const response = await fetch("/api/editions");
        if (!response.ok) {
          throw new Error("Error al cargar las ediciones");
        }
        const data = await response.json();

        // Ordenar ediciones por número en orden descendente
        const sortedEditions = data.sort((a, b) => b.number - a.number);

        setEditions(sortedEditions);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchEditions();
  }, []);

  // Función para truncar texto
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (editions.length === 0) {
    return <p>No hay ediciones disponibles.</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {editions.map((edition) => (
          <div
            key={edition.id}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center"
          >
            <div className="relative w-full h-96">
              <Image
                src={
                  edition.coverImage || "/uploads/fallback/default-cover.jpg"
                }
                alt={`Portada de ${edition.title}`}
                layout="fill"
                objectFit="contain" // Asegura que la imagen no se recorte
                className="rounded-lg"
              />
            </div>
            {/* Aquí se agrega el texto "ILA {edition.number}" con la clase ila-edition */}
            <p className="ila-edition">{`ila ${edition.number}`}</p>
            <h2 className="text-lg font-bold mt-4 mb-2">{edition.title}</h2>
            <p className="text-sm text-gray-500 mb-1">
              {new Date(edition.datePublished).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              {edition.regions.length > 0
                ? `Regiones: ${edition.regions
                    .map((region) => region.name)
                    .join(", ")}`
                : "Sin regiones asociadas"}
            </p>
            <p className="text-sm text-gray-500 mb-1">
              {edition.topics.length > 0
                ? `Temas: ${edition.topics
                    .map((topic) => topic.name)
                    .join(", ")}`
                : "Sin temas asociados"}
            </p>
            <p className="text-sm text-gray-700">
              {truncateText(edition.summary, 150)}{" "}
              <span className="text-blue-500 cursor-pointer">Leer más</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

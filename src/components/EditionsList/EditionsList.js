"use client";

import Link from "next/link";
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
            {/* Contenedor de la imagen */}
            <div className="relative w-full max-w-[300px] h-auto">
              <div className="relative  overflow-hidden aspect-w-3 aspect-h-4">
                {/* Imagen de la portada */}
                <Image
                  src={edition.coverImage}
                  alt={`Portada de ${edition.title}`}
                  width={300} // Ajusta el ancho según el diseño
                  height={400} // Ajusta la altura proporcionalmente
                  objectFit="contain" // Asegura que la imagen no se recorte ni deforme
                />

                {/* Ícono del carrito */}
                {edition.isAvailableToOrder && (
                  <div className="absolute top-2 right-2 z-10">
                    <i className="fa fa-shopping-cart text-white text-xl bg-red-600 p-1 rounded-full shadow-lg transition-all duration-200 ease-in-out hover:bg-red-800 hover:scale-110"></i>
                  </div>
                )}
              </div>
            </div>

            <p className="ila-edition">{`ila ${edition.number}`}</p>
            <h2 className="text-lg font-bold mt-4 mb-2">{edition.title}</h2>
            <p className="text-sm text-gray-500 mb-1">
              {new Date(edition.datePublished).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </p>

            {/* Mostrar las regiones */}
            <p
              className="text-left text-sm font-medium text-white bg-red-500 px-4 py-2 rounded-none shadow-md max-w-xs"
              style={{ backgroundColor: "#D32F2F" }}
            >
              {edition.regions.length > 0
                ? `${edition.regions.map((region) => region.name).join(", ")}`
                : "Sin regiones asociadas"}
            </p>

            {/* Mostrar los topics */}
            {edition.topics.length > 0 && (
              <p
                className="text-left text-sm font-medium text-white bg-green-500 px-4 py-2 rounded-none shadow-md max-w-xs"
                style={{ backgroundColor: "#388E3C" }}
              >
                {edition.topics.map((topic) => topic.name).join(", ")}
              </p>
            )}

            {/* Mostrar texto truncado */}
            <p className="text-gray-700">
              {truncateText(edition.summary, 150)}
            </p>

            {/* Link para leer más */}
            <Link
              href={`/editions/${edition.id}`}
              className="text-blue-500 font-medium mt-2 inline-block"
            >
              Leer más
            </Link>

            {/* Ícono para indicar que es bestellbar */}
          </div>
        ))}
      </div>
    </div>
  );
}

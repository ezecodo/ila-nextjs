"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // Usar useParams para obtener el ID
import Link from "next/link";
import Image from "next/image";

export default function EditionDetails() {
  const { id } = useParams(); // Obtener el ID de la URL
  const [edition, setEdition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchEdition() {
      try {
        const response = await fetch(`/api/editions/${id}`);
        if (!response.ok) {
          throw new Error("Error al cargar la edición");
        }
        const data = await response.json();
        setEdition(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchEdition();
  }, [id]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!edition) {
    return <p>Cargando edición...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Título */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {`ila ${edition.number}: ${edition.title}`}
      </h1>

      {/* Imagen de la portada */}
      <div className="relative w-full max-w-md mx-auto mb-6">
        <Image
          src={edition.coverImage}
          alt={`Portada de ${edition.title}`}
          width={400}
          height={500}
          objectFit="contain"
          className="rounded-lg"
        />
      </div>

      {/* Fecha de publicación */}
      <p className="text-gray-600 mb-4">
        Publicado el{" "}
        {new Date(edition.datePublished).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Resumen */}
      <p className="text-gray-700 mb-6">{edition.summary || "Sin resumen"}</p>

      {/* Regiones */}
      {edition.regions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Regiones:</h2>
          <ul className="list-disc list-inside text-gray-700">
            {edition.regions.map((region) => (
              <li key={region.id}>{region.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Temas */}
      {edition.topics.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Temas:</h2>
          <ul className="list-disc list-inside text-gray-700">
            {edition.topics.map((topic) => (
              <li key={topic.id}>{topic.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Botón para volver */}
      <Link
        href="/editions"
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800 transition"
      >
        Volver a las ediciones
      </Link>
    </div>
  );
}

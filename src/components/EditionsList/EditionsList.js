"use client";

import { useState, useEffect } from "react";

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
        setEditions(data);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchEditions();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (editions.length === 0) {
    return <p>No hay ediciones disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {editions.map((edition) => (
        <div
          key={edition.id}
          className="bg-white rounded-lg shadow p-4 flex flex-col items-center"
        >
          <img
            src={edition.coverImage || "/uploads/fallback/default-cover.jpg"}
            alt={`Portada de ${edition.title}`}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h2 className="text-lg font-bold mb-2">{edition.title}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {new Date(edition.datePublished).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
            })}
          </p>
          <p className="text-sm text-gray-700">{edition.summary}</p>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // Usar useParams para obtener el ID
import Link from "next/link";
import Image from "next/image";
import CartButton from "@/components/CartButton/CartButton"; // Importar el componente

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
      {/* Contenedor para centrar el título y la imagen */}
      <div className="flex flex-col items-center mb-6">
        {/* Título */}
        <h1
          className="text-3xl font-bold text-gray-800 mb-4 text-center"
          style={{ fontFamily: "Futura" }}
        >
          {`ila ${edition.number}: ${edition.title}`}
        </h1>

        {/* Imagen de la portada */}
        <div className="relative max-w-[550px] mb-4">
          <Image
            src={edition.coverImage}
            alt={`Portada de ${edition.title}`}
            width={550}
            height={700}
            objectFit="contain"
            className=""
          />

          {/* Mostrar las regiones */}
          <div className="badgesContainer">
            {edition.regions.length > 0 ? (
              edition.regions.map((region) => (
                <span key={region.id} className="regionBadge">
                  {region.name}
                </span>
              ))
            ) : (
              <span className="regionBadge">Sin regiones asociadas</span>
            )}
          </div>

          {/* Mostrar los temas */}
          <div className="badgesContainer">
            {edition.topics.length > 0 ? (
              edition.topics.map((topic) => (
                <span key={topic.id} className="topicBadge">
                  {topic.name}
                </span>
              ))
            ) : (
              <span className="topicBadge">Sin temas asociados</span>
            )}
          </div>
          {/* Botón del carrito solo si la edición es bestellbar */}
          {edition.isAvailableToOrder && (
            <CartButton
              onClick={() => console.log("Añadido al carrito")} //
              className="ml-2" // Espaciado izquierdo del carrito
            />
          )}
        </div>
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
      <div className="text-gray-700 mb-6">
        {edition.summary
          ? edition.summary.split("\n").map((line, index) => (
              <p key={index} className="mb-4">
                {" "}
                {/* Espacio entre líneas */}
                {line}
              </p>
            ))
          : "Sin resumen"}
      </div>

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

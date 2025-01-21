"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react"; // Para el modal
import Image from "next/image";
import Link from "next/link";

export default function EditionsList() {
  const [editions, setEditions] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // Controla el estado del modal
  const [popupImage, setPopupImage] = useState(null); // Guarda la imagen que se mostrará en el modal

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

  // Abre el modal y establece la imagen
  const openPopup = (imageUrl) => {
    setPopupImage(imageUrl);
    setIsOpen(true);
  };

  // Cierra el modal
  const closePopup = () => {
    setIsOpen(false);
    setPopupImage(null);
  };

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
            <div
              className="relative w-full max-w-[300px] cursor-pointer"
              onClick={() =>
                edition.coverImage && openPopup(edition.coverImage)
              } // Solo abrir popup si hay imagen
            >
              <div className="relative overflow-hidden aspect-w-3 aspect-h-4">
                {/* Imagen de la portada */}
                <Image
                  src={edition.coverImage}
                  alt={`Portada de ${edition.title}`}
                  width={300}
                  height={400}
                  objectFit="contain"
                  className="" // No redondear bordes
                />

                {/* Ícono del carrito */}
                {edition.isAvailableToOrder && (
                  <div className="absolute top-2 right-2 z-10">
                    <i className="fa fa-shopping-cart text-white text-xl bg-red-600 p-1 rounded-full shadow-lg transition-all duration-200 ease-in-out hover:bg-red-800 hover:scale-110"></i>
                  </div>
                )}
              </div>
            </div>

            {/* Título y datos adicionales */}
            <p className="ila-edition">{`ila ${edition.number}`}</p>
            <h2 className="text-lg font-bold mt-4 mb-2">{edition.title}</h2>
            <p className="text-sm text-gray-500 mb-1">
              {new Date(edition.datePublished).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </p>

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
          </div>
        ))}
      </div>

      {/* Modal de Headless UI */}
      <Dialog
        open={isOpen}
        onClose={closePopup}
        className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-70"
      >
        <Dialog.Panel className="relative bg-white rounded-lg shadow-lg p-4 max-w-[500px] pt-[-2px]">
          {/* Imagen ampliada */}
          {popupImage && (
            <Image
              src={popupImage}
              alt="Imagen ampliada"
              width={500} // Tamaño ajustado
              height={700}
              objectFit="contain"
              className=""
            />
          )}
          {/* Botón de cierre */}
          <button
            className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-800 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            onClick={closePopup}
          >
            ✕
          </button>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}

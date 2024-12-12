"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function EditionsList() {
  const [editions, setEditions] = useState([]);
  const [error, setError] = useState(null);
  const [modalImage, setModalImage] = useState(null); // Estado para la imagen del modal
  const imageRefs = useRef([]); // Referencias para las imágenes

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

  // Función para abrir el modal y centrar la imagen en el viewport
  const openModal = (imageUrl, index) => {
    setModalImage(imageUrl); // Establece la imagen para mostrar en el modal

    // Obtiene la referencia de la imagen
    const imageElement = imageRefs.current[index];

    // Calcula la posición de la imagen con respecto al viewport
    const imagePosition =
      imageElement.getBoundingClientRect().top + window.scrollY;
    const viewportHeight = window.innerHeight;

    // Desplaza la página suavemente para centrar la imagen en el viewport
    window.scrollTo({
      top: imagePosition - viewportHeight / 2 + imageElement.clientHeight / 2,
      behavior: "smooth",
    });
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalImage(null); // Establece la imagen en null para cerrar el modal
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
        {editions.map((edition, index) => (
          <div
            key={edition.id}
            className="bg-white rounded-lg shadow p-6 flex flex-col items-center"
          >
            <div
              className="relative w-full h-96 cursor-pointer"
              onClick={() =>
                openModal(
                  edition.coverImage || "/uploads/fallback/default-cover.jpg",
                  index
                )
              }
              ref={(el) => (imageRefs.current[index] = el)} // Asignar la referencia de cada imagen
            >
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
            <p className="ila-edition">{`ila ${edition.number}`}</p>
            <h2 className="text-lg font-bold mt-4 mb-2">{edition.title}</h2>
            <p className="text-sm text-gray-500 mb-1">
              {new Date(edition.datePublished).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
              })}
            </p>

            {/* Mostrar las regiones alineadas a la izquierda pero sin ocupar todo el espacio */}
            <p
              className="text-left text-sm font-medium text-white bg-red-500 px-4 py-2 rounded-none shadow-md max-w-xs"
              style={{ backgroundColor: "#D32F2F" }} // Usando un rojo más mate
            >
              {edition.regions.length > 0
                ? `${edition.regions.map((region) => region.name).join(", ")}`
                : "Sin regiones asociadas"}
            </p>

            {/* Mostrar los topics alineados a la izquierda pero sin ocupar todo el espacio */}
            {edition.topics.length > 0 && (
              <p
                className="text-left text-sm font-medium text-white bg-green-500 px-4 py-2 rounded-none shadow-md max-w-xs"
                style={{ backgroundColor: "#388E3C" }} // Verde mate
              >
                {edition.topics.map((topic) => topic.name).join(", ")}
              </p>
            )}

            <p className="text-sm text-gray-700">
              {truncateText(edition.summary, 150)}{" "}
              <span className="text-blue-500 cursor-pointer">Leer más</span>
            </p>
          </div>
        ))}
      </div>

      {/* Modal para ver la imagen ampliada */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={closeModal}
        >
          <div className="relative">
            <Image
              src={modalImage}
              alt="Imagen ampliada"
              width={800}
              height={800}
              objectFit="contain"
              className="rounded-lg"
            />
            <button
              className="absolute top-4 right-4 text-white text-2xl font-bold"
              onClick={closeModal}
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

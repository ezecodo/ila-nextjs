"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function EditionsList() {
  const [editions, setEditions] = useState([]);
  const [error, setError] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

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

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalIsOpen(true);

    // Bloquear el scroll del fondo
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedImage("");

    // Restaurar el scroll del fondo
    document.body.style.overflow = "";
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (editions.length === 0) {
    return <p>No hay ediciones disponibles.</p>;
  }

  return (
    <div>
      {/* Lista de ediciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {editions.map((edition) => (
          <div
            key={edition.id}
            className="bg-white rounded-lg shadow p-4 flex flex-col items-center cursor-pointer"
            onClick={() => openModal(edition.coverImage)}
          >
            <Image
              src={edition.coverImage || "/uploads/fallback/default-cover.jpg"}
              alt={`Portada de ${edition.title}`}
              width={200}
              height={300}
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

      {/* Modal */}
      {modalIsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-75 flex justify-center items-center"
          onClick={closeModal}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg p-4 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cierre */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-700 hover:text-gray-900"
            >
              ✖
            </button>

            {/* Imagen optimizada */}
            <Image
              src={selectedImage}
              alt="Imagen seleccionada"
              width={600}
              height={800}
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

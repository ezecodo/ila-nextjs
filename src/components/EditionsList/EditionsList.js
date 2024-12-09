"use client";

import { useState, useEffect } from "react";

export default function EditionsList() {
  const [editions, setEditions] = useState([]);
  const [error, setError] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false); // Estado del modal
  const [selectedImage, setSelectedImage] = useState(""); // Imagen seleccionada

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
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedImage("");
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
            onClick={() => openModal(edition.coverImage)} // Abrir modal al hacer clic
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

      {/* Modal */}
      {modalIsOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
          onClick={closeModal} // Cierra el modal al hacer clic en el fondo
        >
          <div
            className="absolute bg-white rounded-lg shadow-lg p-6 max-w-lg w-full top-20"
            onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer clic dentro del modal
          >
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-700 hover:text-gray-900"
            >
              ✖
            </button>
            {/* Imagen redimensionada */}
            <img
              src={selectedImage}
              alt="Imagen seleccionada"
              className="w-full max-w-sm h-auto mx-auto" // Máximo ancho y auto-ajuste
            />
          </div>
        </div>
      )}
    </div>
  );
}

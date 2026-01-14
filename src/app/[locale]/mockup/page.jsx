"use client";

import React, { useState } from "react";
// Asegúrate de que la ruta coincida con tu estructura de carpetas
import DossierMockup from "../components/DossierMockup/DossierMockup";

export default function MockupPage() {
  // 1. Estado para controlar si el libro está abierto o cerrado
  const [isFlipped, setIsFlipped] = useState(false);

  // 2. Datos de prueba (Mock Data) que el componente espera
  const mockIssue = {
    id: 505,
    title: "Kolumbien",
    subtitle: "Frieden und Widerstand",
    month: "Dezember",
    year: 2024,
    color: "from-red-800 via-red-700 to-red-900", // Color de fondo de la portada
    isNew: true,
  };

  const handleToggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Vista Previa: Dossier Mockup
        </h1>
        <p className="text-gray-500">
          Haz clic en el botón o pasa el mouse sobre el libro para interactuar.
        </p>
      </div>

      {/* Aquí renderizamos tu componente 3D */}
      <DossierMockup
        issue={mockIssue}
        isFlipped={isFlipped}
        onToggleFlip={handleToggleFlip}
      />

      <div className="mt-12 flex gap-4">
        <button
          onClick={() => setIsFlipped(false)}
          className="px-6 py-2 bg-white text-gray-700 rounded-full shadow hover:bg-gray-50 transition font-medium"
        >
          Ver Portada
        </button>
        <button
          onClick={() => setIsFlipped(true)}
          className="px-6 py-2 bg-red-600 text-white rounded-full shadow hover:bg-red-700 transition font-medium"
        >
          Ver Interior
        </button>
      </div>
    </main>
  );
}

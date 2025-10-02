"use client";
import { useState } from "react";

const faqData = {
  Artículos: [
    {
      q: "¿Cómo agrego un artículo nuevo?",
      a: "Entra a 'Artículos > Nuevo'. Llena los campos obligatorios (Título, Subtítulo, Autor, Edición) y guarda.",
    },
    {
      q: "¿Cómo asigno un traductor?",
      a: "En la sección 'Asignar Traducciones' selecciona un traductor en el desplegable y presiona 'Asignar'.",
    },
    {
      q: "¿Qué significa el estado 'Revisión'?",
      a: "Significa que el artículo ya está traducido pero debe ser revisado por un revisor antes de aprobarse.",
    },
  ],
  Dossiers: [
    {
      q: "¿Cómo vinculo un artículo a un dossier?",
      a: "Al crear o editar un artículo selecciona el dossier en el campo 'Edición/Dossier'.",
    },
    {
      q: "¿Dónde se edita el título y número?",
      a: "En 'Dossiers > Editar' puedes modificar el título, número y fecha de publicación.",
    },
  ],
  Eventos: [
    {
      q: "¿Cómo agrego un evento?",
      a: "Ve a 'Eventos > Crear' e ingresa título, descripción, fecha, dirección e imagen. Se mostrará en el calendario del sitio.",
    },
  ],
  Carruseles: [
    {
      q: "¿Cómo se agregan artículos a un carrusel?",
      a: "En 'Carruseles' selecciona el carrusel deseado y añade artículos desde la lista.",
    },
  ],
  Aktuelles: [
    {
      q: "¿Qué es un 'Aktuelles'?",
      a: "Son noticias breves que aparecen en la página de inicio. Pueden incluir enlaces externos.",
    },
  ],
  General: [
    {
      q: "¿Por qué debo pegar texto sin formato?",
      a: "Porque el formato de Word/PDF rompe el editor y afecta el SEO. Usa Google Docs > Pegar sin formato.",
    },
  ],
};

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState(null);
  const [openQuestion, setOpenQuestion] = useState(null);

  const toggleCategory = (category) => {
    setOpenCategory(openCategory === category ? null : category);
    setOpenQuestion(null);
  };

  const toggleQuestion = (index) => {
    setOpenQuestion(openQuestion === index ? null : index);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-red-600 mb-6">
        ❓ Preguntas Frecuentes (FAQ)
      </h1>
      <div className="space-y-4">
        {Object.entries(faqData).map(([category, questions]) => (
          <div key={category} className="border rounded-lg">
            {/* Categoría */}
            <button
              className="w-full flex justify-between items-center p-4 text-left font-semibold bg-gray-100"
              onClick={() => toggleCategory(category)}
            >
              {category}
              <span>{openCategory === category ? "−" : "+"}</span>
            </button>

            {openCategory === category && (
              <div className="p-2 space-y-2">
                {questions.map((faq, i) => (
                  <div key={i} className="border rounded">
                    <button
                      className="w-full flex justify-between items-center p-3 text-left text-sm font-medium"
                      onClick={() => toggleQuestion(i)}
                    >
                      {faq.q}
                      <span>{openQuestion === i ? "−" : "+"}</span>
                    </button>
                    {openQuestion === i && (
                      <div className="p-3 text-sm text-gray-700 bg-gray-50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

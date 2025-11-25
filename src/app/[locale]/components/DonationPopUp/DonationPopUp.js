"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DonationPopup({ articleId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [covers, setCovers] = useState([]);
  const t = useTranslations("donationPopup");

  useEffect(() => {
    if (!articleId) return;

    const seenArticles =
      JSON.parse(sessionStorage.getItem("seenArticles")) || [];

    if (!seenArticles.includes(articleId)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        seenArticles.push(articleId);
        sessionStorage.setItem("seenArticles", JSON.stringify(seenArticles));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [articleId]);

  // Cargar portadas de dossiers
  useEffect(() => {
    async function loadCovers() {
      try {
        const res = await fetch("/api/editions?limit=20");
        const data = await res.json();
        const coverImages = data.map((d) => d.coverImage);

        // Función para mezclar array aleatoriamente
        const shuffled = coverImages.sort(() => Math.random() - 0.5);
        setCovers(shuffled);
      } catch (err) {
        console.error("Error loading covers:", err);
      }
    }
    loadCovers();
  }, []);

  // Re-shuffle cuando se abre el popup
  useEffect(() => {
    if (isOpen && covers.length > 0) {
      const shuffled = [...covers].sort(() => Math.random() - 0.5);
      setCovers(shuffled);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
    >
      {/* Backdrop con portadas reales difuminadas */}
      <div className="fixed inset-0 bg-black/65" aria-hidden="true">
        <div className="absolute inset-0 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 p-4 opacity-60">
          {covers.length > 0 &&
            [...Array(21)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-lg overflow-hidden shadow-2xl blur-[1.5px]"
                style={{
                  transform: `rotate(${Math.random() * 6 - 3}deg)`,
                  opacity: 0.6 + Math.random() * 0.4,
                }}
              >
                <img
                  src={covers[i % covers.length]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Panel del popup */}
      <Dialog.Panel className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden animate-slide-down">
        {/* Botón de cerrar */}
        <button
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 hover:rotate-90 shadow-lg"
          onClick={handleClose}
          aria-label="Cerrar"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Sección superior con logo y decoración */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 sm:p-8 pb-8 sm:pb-10 relative">
          {/* Patrón decorativo de fondo */}
          <div className="absolute inset-0 opacity-10">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          {/* Logo ila */}
          <div className="relative flex justify-center mb-4 sm:mb-6">
            <div className="bg-white w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg">
              <span
                className="text-3xl sm:text-5xl font-bold text-red-600"
                style={{ fontFamily: "Futura, sans-serif" }}
              >
                ila
              </span>
            </div>
          </div>

          {/* Ilustración: Línea de vida del periodismo */}
          <div className="relative flex justify-center items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <svg
                className="w-8 h-8 sm:w-12 sm:h-12 text-white animate-pulse"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <svg
                className="w-6 h-6 sm:w-10 sm:h-10 text-white/80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <svg
                className="w-6 h-6 sm:w-10 sm:h-10 text-white/80"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
          </div>

          {/* Texto hero en blanco sobre rojo */}
          <div className="relative text-center text-white mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 leading-tight">
              {t("title")}
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-light opacity-90">
              {t("subtitle")}
            </p>
          </div>

          {/* ✅ ONDA SUAVE */}
          <div
            className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]"
            style={{ height: "40px" }}
          >
            <svg
              viewBox="0 0 1200 120"
              preserveAspectRatio="none"
              className="relative block w-full h-full"
            >
              <path
                d="M0,50 C150,20 300,80 450,50 C600,20 750,80 900,50 C1050,20 1150,50 1200,40 L1200,120 L0,120 Z"
                className="fill-white dark:fill-gray-900"
              />
            </svg>
          </div>
        </div>

        {/* Contenido inferior */}
        <div className="p-4 sm:p-8 bg-white dark:bg-gray-900">
          {/* Call to action */}
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-6 sm:mb-8 leading-tight">
            {t("description")}
          </p>

          {/* Estadística impactante */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-center border-2 border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">
                  49
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 sm:mt-2">
                  {t("years")}
                </div>
              </div>
              <div className="h-px w-full sm:h-12 sm:w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">
                  10x
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 sm:mt-2">
                  {t("yearly")}
                </div>
              </div>
              <div className="h-px w-full sm:h-12 sm:w-px bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">
                  100%
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1 sm:mt-2">
                  {t("independent")}
                </div>
              </div>
            </div>
          </div>

          {/* Botón de donación */}
          <div className="flex justify-center">
            <Link
              href="/support/donations"
              className="group relative px-6 py-3 sm:px-8 sm:py-4 bg-red-600 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg hover:bg-red-700 transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 overflow-hidden w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {t("donateButton")}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </Link>
          </div>

          {/* Mensaje de confianza */}
          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6 px-2">
            {t("trustMessage")}
          </p>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

// Estilos CSS en línea
const styles = `
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slideDown 0.5s ease-out;
}
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

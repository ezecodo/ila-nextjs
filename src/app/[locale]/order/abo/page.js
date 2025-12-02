"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import AboForm from "./components/AboForm/AboForm";

export default function AboPage() {
  const t = useTranslations("abo");
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    async function loadGifts() {
      try {
        const res = await fetch("/api/gifts");
        const data = await res.json();
        setGifts(data);
      } catch (err) {
        console.error("Error cargando premios:", err);
      }
    }
    loadGifts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-8 md:py-14 px-3 md:px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800/80 backdrop-blur-md p-5 md:p-10 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
        <h1 className="text-2xl md:text-4xl font-extrabold text-center mb-4 md:mb-6 text-gray-900 dark:text-white tracking-tight">
          {t("title")}
        </h1>

        {/* Intro */}
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6 md:mb-8 text-base md:text-lg leading-relaxed whitespace-pre-line">
          {t("heroIntro")}
        </p>

        {/* Banner Promocional - Mobile First */}
        <div className="mb-6 md:mb-8 relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 shadow-2xl">
          {/* Patrón de fondo sutil */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            ></div>
          </div>

          <div className="relative px-4 md:px-8 py-5 md:py-8">
            {/* Título pequeño */}
            <div className="text-red-100 text-xs md:text-sm font-semibold uppercase tracking-wider mb-3">
              {t("promo.title")}
            </div>

            {/* BENEFICIO PRINCIPAL - MUY VISIBLE */}
            <div className="bg-white/95 dark:bg-gray-900/95 rounded-lg md:rounded-xl px-4 md:px-6 py-4 md:py-5 mb-4 md:mb-5 shadow-xl">
              <div className="flex items-start md:items-center gap-3 md:gap-4">
                <div className="flex-shrink-0 mt-1 md:mt-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 md:h-12 md:w-12 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {t("promo.gift")}
                </p>
              </div>
            </div>

            {/* Detalles/Condiciones */}
            <p className="text-white/90 text-sm md:text-base leading-relaxed mb-3 md:mb-4">
              {t("promo.conditions")}
            </p>

            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 md:h-4 md:w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{t("promo.deadline")}</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="animate-fade-in-up">
          <AboForm gifts={gifts} />
        </div>
      </div>
    </div>
  );
}

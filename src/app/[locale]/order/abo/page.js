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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 py-14 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-gray-900 dark:text-white tracking-tight">
          {t("title")}
        </h1>

        {/* Intro */}
        <p className="text-center text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed whitespace-pre-line">
          {t("heroIntro")}
        </p>

        {/* Aviso / Promo */}
        <div className="mx-auto max-w-2xl flex items-center gap-3 border-l-4 border-red-500 bg-red-100 dark:bg-red-900/30 p-5 text-red-900 dark:text-red-100 rounded-lg shadow-inner whitespace-pre-line mb-10">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-300 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M8.257 3.099c.366-.446.957-.554 1.408-.29l.094.07 6.29 5.778c.39.358.43.93.128 1.343l-.083.094-6.29 5.778a1.013 1.013 0 01-1.592-.836v-2.737l-3.493-.001A1.013 1.013 0 014 11.414v-2.828c0-.54.435-.977.975-.977l3.493-.001V4.006c0-.397.232-.755.57-.907l.219-.09z" />
          </svg>
          <span className="flex-1 text-sm sm:text-base">{t("promo2025")}</span>
        </div>

        {/* Formulario */}
        <div className="animate-fade-in-up">
          <AboForm gifts={gifts} />
        </div>
      </div>
    </div>
  );
}

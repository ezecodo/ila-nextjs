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

        {/* Formulario */}
        <div className="animate-fade-in-up">
          <AboForm gifts={gifts} />
        </div>
      </div>
    </div>
  );
}

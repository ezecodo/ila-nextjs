"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// Índice de todos los autores con al menos un artículo (destino del stat "Autor*innen"
// del bloque de banner "Stats del archivo" — ver STAT_HREF en
// components/Banners/SlideBanner/blocks.js). Reusa /api/entities/authors, que ya filtra
// autores sin artículos y ordena por cantidad desc (misma fuente que alimenta el selector
// de GLOBila).
export default function AuthorsIndexPage() {
  const locale = useLocale();
  const t = useTranslations("entitiesIndex");

  const [authors, setAuthors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAuthors() {
      try {
        const res = await fetch("/api/entities/authors");
        if (!res.ok) throw new Error("Error al cargar autores");
        setAuthors(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuthors();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t("authorsTitle")}
      </h1>

      {isLoading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {authors.map((author) => (
            <Link
              key={author.id}
              href={`/${locale}/authors/${author.id}`}
              className="group flex items-baseline justify-between gap-2 border border-gray-200 dark:border-gray-700 rounded-none px-3 py-2 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#BD0E0D] truncate">
                {author.name}
              </span>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {t("articleCount", { count: author.count })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

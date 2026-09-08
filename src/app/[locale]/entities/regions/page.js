"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// Índice de todas las regiones (hoja, sin hijos) con al menos un artículo, destino del
// stat "Regionen" del bloque de banner "Stats del archivo" — ver STAT_HREF en
// components/Banners/SlideBanner/blocks.js). Cada región linkea a la página de resultados
// que ya existía (/entities/regions/[id], vía ArticlesByEntity).
//
// /api/regions?leafOnly=true (a diferencia de /api/entities/topics) no filtra por
// count > 0 ni ordena por cantidad — se hace acá, en el cliente.
export default function RegionsIndexPage() {
  const locale = useLocale();
  const isES = locale === "es";
  const t = useTranslations("entitiesIndex");

  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRegions() {
      try {
        const res = await fetch("/api/regions?leafOnly=true");
        if (!res.ok) throw new Error("Error al cargar regiones");
        const data = await res.json();
        const withArticles = data
          .filter((r) => (r._count?.articles || 0) > 0)
          .sort((a, b) => b._count.articles - a._count.articles);
        setRegions(withArticles);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRegions();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t("regionsTitle")}
      </h1>

      {isLoading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {regions.map((region) => (
            <Link
              key={region.id}
              href={`/${locale}/entities/regions/${region.id}`}
              className="group flex items-baseline justify-between gap-2 border border-gray-200 dark:border-gray-700 rounded-none px-3 py-2 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#BD0E0D] truncate">
                {isES && region.nameES ? region.nameES : region.name}
              </span>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {t("articleCount", { count: region._count.articles })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

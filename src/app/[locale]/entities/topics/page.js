"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

// Índice de todos los temas con al menos un artículo (destino del stat "Themen" del
// bloque de banner "Stats del archivo" — ver STAT_HREF en
// components/Banners/SlideBanner/blocks.js). Cada tema linkea a la página de resultados
// que ya existía (/entities/topics/[id], vía ArticlesByEntity) — no se reinventa esa parte.
export default function TopicsIndexPage() {
  const locale = useLocale();
  const isES = locale === "es";
  const t = useTranslations("entitiesIndex");

  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const res = await fetch("/api/entities/topics");
        if (!res.ok) throw new Error("Error al cargar temas");
        setTopics(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTopics();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t("topicsTitle")}
      </h1>

      {isLoading ? (
        <p className="text-gray-500">{t("loading")}</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/${locale}/entities/topics/${topic.id}`}
              className="group flex items-baseline justify-between gap-2 border border-gray-200 dark:border-gray-700 rounded-none px-3 py-2 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#BD0E0D] truncate">
                {isES && topic.nameES ? topic.nameES : topic.name}
              </span>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {t("articleCount", { count: topic.count })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import MiniArticleCardGrid from "../../components/Articles/MiniArticleCardGrid";
import IlaLoader from "../../components/IlaLoader/IlaLoader";

export default function OnlineOnlyPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const t = useTranslations("onlineOnly");

  useEffect(() => {
    async function fetchOnlineArticles() {
      try {
        const params = new URLSearchParams({
          onlineOnly: "true",
          limit: "100",
          locale: locale,
        });

        const res = await fetch(`/api/articles/filtered?${params.toString()}`);
        const data = await res.json();

        setArticles(data.articles || []);
        setLoading(false);
      } catch (error) {
        console.error("Error cargando artículos online:", error);
        setLoading(false);
      }
    }

    fetchOnlineArticles();
  }, [locale]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {locale === "de" ? "Nur Online" : "Solo Online"}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {locale === "de"
            ? "Artikel, die ausschließlich online verfügbar sind"
            : "Artículos disponibles exclusivamente en línea"}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {locale === "de"
              ? "Keine Online-Artikel gefunden"
              : "No se encontraron artículos online"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, idx) => (
            <MiniArticleCardGrid
              key={article.id}
              article={article}
              delay={idx * 100}
            />
          ))}
        </div>
      )}
    </div>
  );
}

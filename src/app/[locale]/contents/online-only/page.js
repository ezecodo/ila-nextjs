"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import MiniArticleCardGrid from "../../components/Articles/MiniArticleCardGrid";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import QuietSectionHeader from "../../components/SectionsHeader/QuietSectionHeader";

export default function OnlineOnlyPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(56);
  const locale = useLocale();
  const t = useTranslations("onlineOnly");

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setHeaderHeight(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

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
    <>
      <div
        className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 z-40 bg-white dark:bg-gray-900"
        style={{ position: "sticky", top: headerHeight - 1 }}
      >
        <QuietSectionHeader
          variant="chip"
          title={locale === "de" ? "Nur Online" : "Solo Online"}
          className="px-4 sm:px-6 lg:px-8 pt-3 mb-0"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    </>
  );
}

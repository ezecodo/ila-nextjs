"use client";

import { useState, useEffect } from "react";
import MiniArticleCardGrid from "./MiniArticleCardGrid";

import Pagination from "../Pagination/Pagination";
import { useTranslations, useLocale } from "next-intl";

export default function ArticleList({ articlesProp = null, authorId = null }) {
  const [articles, setArticles] = useState(articlesProp || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const t = useTranslations("article");
  const locale = useLocale();

  useEffect(() => {
    if (articlesProp) {
      setArticles(articlesProp);
      setTotalPages(1);
      return;
    }

    async function fetchArticles() {
      try {
        const baseUrl = authorId
          ? `/api/authors/${authorId}`
          : `/api/articles/list`;

        const url = `${baseUrl}?page=${currentPage}&limit=3&locale=${locale}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error(t("loadArticles"));

        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchArticles();
  }, [currentPage, authorId, articlesProp, locale, t]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  // 🔥 Filtrar artículos si el idioma es español
  const filteredArticles =
    locale === "es"
      ? articles.filter((a) => a.isTranslatedES && !a.needsReviewES)
      : articles;

  if (filteredArticles.length === 0) {
    return <p>{t("noArticles")}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-3">
        {filteredArticles.map((article) => (
          <MiniArticleCardGrid key={article.id} article={article} />
        ))}
      </div>

      {totalPages > 1 && !articlesProp && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

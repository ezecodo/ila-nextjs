"use client";

import { useState, useEffect } from "react";
import ArticleCard from "../Articles/ArticleCard";
import styles from "./ArticleList.module.css";
import Pagination from "../Pagination/Pagination";
import { useTranslations } from "next-intl";

export default function ArticleList({ articlesProp = null, authorId = null }) {
  const [articles, setArticles] = useState(articlesProp || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const t = useTranslations("article");

  useEffect(() => {
    if (articlesProp) {
      setArticles(articlesProp);
      setTotalPages(1); // 🔥 No paginar si ya vienen artículos de búsqueda
      return;
    }

    async function fetchArticles() {
      try {
        const url = authorId
          ? `/api/authors/${authorId}?page=${currentPage}&limit=3`
          : `/api/articles/list?page=${currentPage}&limit=3`;

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
  }, [currentPage, authorId, articlesProp]); // 🔥 Ya no depende de articlesProp

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (articles.length === 0) {
    return <p>{t("noArticles")}</p>;
  }

  return (
    <div>
      <div className={styles.articlesList}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {totalPages > 1 &&
        !articlesProp && ( // 🔥 Evita paginación en búsqueda
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import ArticleCard from "./ArticleCard";
import styles from "./ArticleList.module.css";
import Pagination from "../Pagination/Pagination";

export default function ArticleList({ articlesProp = null, authorId = null }) {
  const [articles, setArticles] = useState(articlesProp || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (articlesProp) return; // ✅ Si ya hay artículos pasados como prop, no hace fetch

    async function fetchArticles() {
      try {
        const url = authorId
          ? `/api/authors/${authorId}?page=${currentPage}&limit=3`
          : `/api/articles/list?page=${currentPage}&limit=3`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Error al cargar los artículos");

        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchArticles();
  }, [currentPage, authorId, articlesProp]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (articles.length === 0) {
    return <p>No hay artículos disponibles.</p>;
  }

  return (
    <div>
      <div className={styles.articlesList}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

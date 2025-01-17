"use client";

import { useState, useEffect } from "react";
import ArticleCard from "./ArticleCard";
import styles from "./ArticleList.module.css"; // Importamos los estilos
import Pagination from "../Pagination/Pagination";

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const response = await fetch(
          `/api/articles/list?page=${currentPage}&limit=10`
        );
        if (!response.ok) {
          throw new Error("Error al cargar los artículos");
        }
        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchArticles();
  }, [currentPage]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (articles.length === 0) {
    return <p>No hay artículos disponibles.</p>;
  }

  return (
    <div>
      <h1 className={styles.title}>Listado de Artículos</h1>

      {/* Listado de Artículos en Grid */}
      <div className={styles.articlesList}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Controles de Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

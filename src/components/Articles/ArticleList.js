"use client";

import { useState, useEffect } from "react";
import ArticleCard from "./ArticleCard";
import styles from "./ArticleList.module.css"; // Importamos los estilos

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

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

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
      <div className={styles.pagination}>
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className={`${styles.paginationButton} ${
            currentPage === 1 ? styles.disabled : ""
          }`}
        >
          Anterior
        </button>
        <span className={styles.paginationInfo}>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`${styles.paginationButton} ${
            currentPage === totalPages ? styles.disabled : ""
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

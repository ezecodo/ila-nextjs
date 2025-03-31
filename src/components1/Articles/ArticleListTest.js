"use client";

import { useState, useEffect } from "react";
import ArticleCardTest from "./ArticleCardTest"; // Usamos el componente de prueba
import styles from "./ArticleListTest.module.css"; // CSS para el layout
import Pagination from "../Pagination/Pagination";

export default function ArticleListTest() {
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

  // Separar el artículo destacado del resto
  const featuredArticle = articles[0]; // Primer artículo
  const regularArticles = articles.slice(1, 7); // Los siguientes 6 artículos

  return (
    <div>
      <div className={styles.articlesGrid}>
        {/* Artículo destacado */}
        {featuredArticle && (
          <ArticleCardTest
            key={featuredArticle.id}
            article={featuredArticle}
            className={styles.featuredCard}
          />
        )}

        {/* Artículos regulares */}
        {regularArticles.map((article) => (
          <ArticleCardTest
            key={article.id}
            article={article}
            className={styles.regularCard}
          />
        ))}
      </div>

      {/* Controles de paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

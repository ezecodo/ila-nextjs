"use client";

import { useEffect, useState } from "react";
import styles from "./ArticlesList.module.css"; // Crear un archivo CSS para estilos personalizados

export default function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch de artículos desde la API
    const fetchArticles = async () => {
      try {
        const res = await fetch("/api/articles");
        if (!res.ok) throw new Error("Error al obtener los artículos");

        const data = await res.json();
        setArticles(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) return <p>Cargando artículos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.articlesList}>
      {articles.map((article) => (
        <div key={article.id} className={styles.articleCard}>
          {/* Mostrar la imagen */}
          {article.articleImage && (
            <img
              src={article.articleImage}
              alt={article.title}
              className={styles.articleImage}
            />
          )}
          <div className={styles.articleContent}>
            {/* Título */}
            <h2 className={styles.articleTitle}>{article.title}</h2>

            {/* Categorías */}
            <div className={styles.articleCategories}>
              {article.categories.map((category) => (
                <span key={category.id} className={styles.categoryBadge}>
                  {category.name}
                </span>
              ))}
            </div>

            {/* Subtítulo */}
            <p className={styles.articleSubtitle}>{article.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

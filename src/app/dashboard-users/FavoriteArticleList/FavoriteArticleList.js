"use client";

import { useState, useEffect } from "react";
import ArticleList from "../../../components/Articles/ArticleList";

export default function FavoriteArticlesList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteArticles = async () => {
      try {
        console.log("➡️ Fetching artículos favoritos...");
        const response = await fetch("/api/articles/list?favorites=true");

        if (!response.ok) {
          console.error(
            "❌ Error al obtener artículos favoritos:",
            response.status
          );
          return;
        }

        const data = await response.json();
        setArticles(data.articles);
      } catch (error) {
        console.error("❌ Error al obtener artículos favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteArticles();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Artículos Favoritos</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : articles.length > 0 ? (
        <ArticleList articlesProp={articles} />
      ) : (
        <p>No tienes artículos favoritos aún.</p>
      )}
    </div>
  );
}

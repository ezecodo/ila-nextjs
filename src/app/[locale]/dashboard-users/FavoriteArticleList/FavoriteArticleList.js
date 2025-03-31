"use client";

import { useState, useEffect } from "react";
import ArticleList from "../../components/Articles/ArticleList";
import Pagination from "../../components/Pagination/Pagination";

export default function FavoriteArticlesList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFavoriteArticles = async (page = 1) => {
    try {
      console.log(`➡️ Fetching artículos favoritos... Página: ${page}`);
      setLoading(true); // 🔥 Asegura que muestra el loader mientras carga

      const response = await fetch(
        `/api/articles/list?favorites=true&page=${page}&limit=5`
      );

      if (!response.ok) {
        console.error(
          "❌ Error al obtener artículos favoritos:",
          response.status
        );
        return;
      }

      const data = await response.json();
      setArticles(data.articles);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("❌ Error al obtener artículos favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavoriteArticles(currentPage);
  }, [currentPage]); // ✅ Se ejecuta cada vez que cambia la página

  // ✅ Función para eliminar un artículo de favoritos en tiempo real
  const handleRemoveFavorite = (articleId) => {
    setArticles((prevArticles) =>
      prevArticles.filter((article) => article.id !== articleId)
    );

    // 🔥 Si eliminamos el último favorito en la página actual, volver a la anterior
    if (articles.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Artículos Favoritos</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : articles.length > 0 ? (
        <>
          <ArticleList
            articlesProp={articles}
            onRemoveFavorite={handleRemoveFavorite} // ✅ Pasamos la función para eliminar favoritos
          />
          {totalPages > 1 && ( // ✅ Solo muestra paginación si hay más de 5 favoritos
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <p>No tienes artículos favoritos aún.</p>
      )}
    </div>
  );
}

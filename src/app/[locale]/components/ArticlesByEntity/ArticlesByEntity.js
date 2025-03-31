"use client";

import { useState, useEffect } from "react";
import ArticleCard from "../Articles/ArticleCard";

export default function ArticlesByEntity({ entityType, entityId }) {
  const [entity, setEntity] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!entityId || !entityType) return;

    async function fetchData() {
      try {
        const response = await fetch(
          `/api/entities/${entityType}/${entityId}?page=${page}`
        );
        if (!response.ok) throw new Error(`Error al cargar ${entityType}`);

        const data = await response.json();

        if (page === 1) {
          setEntity(data.category || data[entityType.slice(0, -1)]);
          setArticles(data.articles);
        } else {
          setArticles((prev) => [...prev, ...data.articles]);
        }

        setHasMore(data.pagination.hasMore);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [entityType, entityId, page]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!entity) return <p className="text-gray-500">Cargando información...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {entity.name || entity.title}
      </h1>

      {isLoading && page === 1 ? (
        <p className="text-gray-500">Cargando artículos...</p>
      ) : articles.length > 0 ? (
        <div className="grid gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay artículos disponibles.</p>
      )}

      {/* Botón para cargar más artículos */}
      {hasMore && (
        <button
          onClick={() => setPage((prev) => prev + 1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded shadow"
        >
          Cargar más artículos
        </button>
      )}
    </div>
  );
}

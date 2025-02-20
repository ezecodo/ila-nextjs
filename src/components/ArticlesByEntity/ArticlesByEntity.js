"use client";

import { useState, useEffect } from "react";
import ArticleCard from "@/components/Articles/ArticleCard";

export default function ArticlesByEntity({ entityType, entityId }) {
  const [entity, setEntity] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId || !entityType) return;

    async function fetchData() {
      try {
        const response = await fetch(`/api/${entityType}/${entityId}`);
        if (!response.ok) throw new Error(`Error al cargar ${entityType}`);

        const data = await response.json();
        setEntity(data[entityType.slice(0, -1)]); // Singular: author, region, topic, category
        setArticles(data.articles);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [entityType, entityId]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!entity) return <p className="text-gray-500">Cargando información...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Nombre de la entidad */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {entity.name || entity.title}
      </h1>

      {/* Mostrar "Cargando..." mientras se trae la data */}
      {isLoading ? (
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
    </div>
  );
}

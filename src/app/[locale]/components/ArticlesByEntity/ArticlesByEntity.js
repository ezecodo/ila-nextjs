"use client";

import { useState, useEffect } from "react";
import ArticleList from "../Articles/ArticleList"; // ✅ Reutilizamos ArticleList

export default function ArticlesByEntity({ entityType, entityId }) {
  const [entity, setEntity] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!entityId || !entityType) return;

    async function fetchEntity() {
      try {
        const response = await fetch(`/api/entities/${entityType}/${entityId}`);
        if (!response.ok) throw new Error(`Error al cargar ${entityType}`);

        const data = await response.json();
        setEntity(data.category || data[entityType.slice(0, -1)]);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntity();
  }, [entityType, entityId]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!entity) {
    return <p className="text-gray-500">Cargando información...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Nombre de la entidad (tema, región, categoría...) */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {entity.name || entity.title}
      </h1>

      {/* Lista de artículos usando ArticleList con paginación */}
      {isLoading ? (
        <p className="text-gray-500">Cargando artículos...</p>
      ) : (
        <ArticleList entityType={entityType} entityId={entityId} />
      )}
    </div>
  );
}

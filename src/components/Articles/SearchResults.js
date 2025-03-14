"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ArticleList from "@/components/Articles/ArticleList";
import Pagination from "@/components/Pagination/Pagination";

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const [articles, setArticles] = useState([]); // 🔥 Aseguramos que inicie como un array vacío
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/articles/search?query=${query}&page=${currentPage}&limit=5`
        );
        const data = await response.json();

        // ✅ Verificar que `data.articles` sea un array antes de asignarlo
        setArticles(Array.isArray(data.articles) ? data.articles : []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error al obtener resultados de búsqueda:", error);
        setArticles([]); // 🔥 Evita que sea undefined en caso de error
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentPage]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">
        Resultados de búsqueda para &quot;{query}&quot;:
      </h2>

      {loading ? (
        <p>Cargando resultados...</p>
      ) : articles.length > 0 ? ( // 🔥 Ahora `articles.length` siempre tendrá un valor seguro
        <>
          <ArticleList articlesProp={articles} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      ) : (
        <p>No se encontraron artículos.</p>
      )}
    </div>
  );
}

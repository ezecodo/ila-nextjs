"use client"; // ✅ Forzar renderizado en el cliente

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // ✅ Hook para manejar searchParams
import ArticleList from "./ArticleList";
import Pagination from "../Pagination/Pagination"; // ✅ Importar componente de paginación

const SearchResults = () => {
  const searchParams = useSearchParams(); // ✅ Obtener los parámetros de la URL
  const query = searchParams.get("query") || ""; // ✅ Extraer la query correctamente

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // ✅ Estado para la página actual
  const [totalPages, setTotalPages] = useState(1); // ✅ Estado para el total de páginas

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/articles/search?query=${encodeURIComponent(
            query
          )}&page=${currentPage}&limit=10`
        );
        if (!response.ok) throw new Error("Error en la búsqueda");
        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages); // ✅ Guardamos el total de páginas
      } catch (error) {
        console.error("Error cargando resultados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage]); // ✅ Se ejecuta cuando cambia la búsqueda o la página

  return (
    <div>
      {loading ? (
        <p>Cargando resultados...</p>
      ) : (
        <>
          <ArticleList articlesProp={articles} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage} // ✅ Función para cambiar de página
            />
          )}
        </>
      )}
    </div>
  );
};

export default SearchResults;

"use client"; // ✅ Forzar renderizado en el cliente

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { useSearchParams } from "next/navigation"; // ✅ Hook para manejar searchParams
import ArticleList from "./ArticleList";
import Pagination from "../Pagination/Pagination"; // ✅ Importar componente de paginación
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import AdvancedSearchFilters from "./Search/AdvancedSearchFilters/AdvancedSearchFilters";

const SearchResults = () => {
  const locale = useLocale();
  const t = useTranslations("search");

  const searchParams = useSearchParams(); // ✅ Obtener los parámetros de la URL
  const query = searchParams.get("query") || ""; // ✅ Extraer la query correctamente

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1); // ✅ Estado para la página actual
  const [totalPages, setTotalPages] = useState(1); // ✅ Estado para el total de páginas
  const [filters, setFilters] = useState({
    regions: [],
    topics: [],
    types: [],
    year: "",
  });
  const [searchInput, setSearchInput] = useState(query);
  const router = useRouter();
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    router.push(`/search?query=${encodeURIComponent(searchInput.trim())}`);
  };

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        setLoading(true);

        // Construir URL con filtros
        const params = new URLSearchParams({
          query: query,
          page: currentPage,
          limit: 10,
          locale: locale,
        });

        if (filters.regions.length > 0) {
          params.append("regions", filters.regions.join(","));
        }
        if (filters.topics.length > 0) {
          params.append("topics", filters.topics.join(","));
        }
        if (filters.types.length > 0) {
          params.append("types", filters.types.join(","));
        }
        if (filters.year) {
          params.append("year", filters.year);
        }

        const response = await fetch(
          `/api/articles/search?${params.toString()}`
        );
        if (!response.ok) throw new Error("Error en la búsqueda");
        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error cargando resultados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage, locale, filters]); // ✅ Se ejecuta cuando cambia la búsqueda o la página
  // 🔁 Reiniciar a la página 1 si cambia el idioma
  useEffect(() => {
    setSearchInput(query);
    setCurrentPage(1);
  }, [query, locale]);

  return (
    <div>
      {/* Barra de búsqueda editable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4 border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("placeholder")}
              className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <FaSearch />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <FaSearch />
            {t("search")}
          </button>
        </form>

        {query && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {t("searchingFor")}:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{query}"
            </span>
          </p>
        )}
      </div>

      <AdvancedSearchFilters onFiltersChange={setFilters} locale={locale} />

      {loading ? (
        <p>{t("loading")}</p>
      ) : articles.length > 0 ? (
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
        <p className="text-gray-500">{t("noResults")}</p>
      )}
    </div>
  );
};

export default SearchResults;

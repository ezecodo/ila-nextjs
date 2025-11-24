"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import SearchableMultiSelect from "../AdvancedSearchFilters/SearchableMultiSelect";

export default function AdvancedSearchFilters({ onFiltersChange, locale }) {
  const t = useTranslations("search");
  const [isExpanded, setIsExpanded] = useState(false);

  // Estados de filtros
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  // Datos disponibles
  const [regions, setRegions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [types, setTypes] = useState([]);

  // Cargar opciones
  useEffect(() => {
    async function loadFilters() {
      try {
        const [regionsRes, topicsRes, typesRes] = await Promise.all([
          fetch("/api/regions?leafOnly=true"), // ✅ Solo esta línea cambió
          fetch("/api/topics"),
          fetch("/api/beitragstypen"),
        ]);

        const [regionsData, topicsData, typesData] = await Promise.all([
          regionsRes.json(),
          topicsRes.json(),
          typesRes.json(),
        ]);

        setRegions(regionsData); // ✅ TODOS los datos
        setTopics(topicsData); // ✅ TODOS los datos
        setTypes(typesData);
      } catch (error) {
        console.error("Error cargando filtros:", error);
      }
    }

    loadFilters();
  }, []);

  // Notificar cambios
  useEffect(() => {
    onFiltersChange({
      regions: selectedRegions,
      topics: selectedTopics,
      types: selectedTypes,
      year: selectedYear,
    });
  }, [
    selectedRegions,
    selectedTopics,
    selectedTypes,
    selectedYear,
    onFiltersChange,
  ]);

  const toggleRegion = (id) => {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleTopic = (id) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleType = (id) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedRegions([]);
    setSelectedTopics([]);
    setSelectedTypes([]);
    setSelectedYear("");
  };

  const hasActiveFilters =
    selectedRegions.length > 0 ||
    selectedTopics.length > 0 ||
    selectedTypes.length > 0 ||
    selectedYear !== "";

  const currentYear = new Date().getFullYear();
  // Últimos 50 años (hasta 1975)
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            🔍 {t("advancedSearch")}
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
              {selectedRegions.length +
                selectedTopics.length +
                selectedTypes.length +
                (selectedYear ? 1 : 0)}{" "}
              activos
            </span>
          )}
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {/* Filtros activos (siempre visibles si hay) */}
      {hasActiveFilters && !isExpanded && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {selectedRegions.map((id) => {
            const region = regions.find((r) => r.id === id);
            return region ? (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                🌎{" "}
                {locale === "es" && region.nameES ? region.nameES : region.name}
                <button
                  onClick={() => toggleRegion(id)}
                  className="hover:text-blue-900"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            ) : null;
          })}

          {selectedTopics.map((id) => {
            const topic = topics.find((t) => t.id === id);
            return topic ? (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm"
              >
                🏷️ {locale === "es" && topic.nameES ? topic.nameES : topic.name}
                <button
                  onClick={() => toggleTopic(id)}
                  className="hover:text-green-900"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            ) : null;
          })}

          {selectedTypes.map((id) => {
            const type = types.find((t) => t.id === id);
            return type ? (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
              >
                📝 {locale === "es" && type.nameES ? type.nameES : type.name}
                <button
                  onClick={() => toggleType(id)}
                  className="hover:text-purple-900"
                >
                  <FaTimes size={12} />
                </button>
              </span>
            ) : null;
          })}

          {selectedYear && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
              📅 {selectedYear}
              <button
                onClick={() => setSelectedYear("")}
                className="hover:text-orange-900"
              >
                <FaTimes size={12} />
              </button>
            </span>
          )}

          <button
            onClick={clearFilters}
            className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-sm font-medium"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Panel expandido */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          {/* Regiones */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              🌎 {t("regions")}
            </h3>
            <SearchableMultiSelect
              options={regions}
              selectedIds={selectedRegions}
              onToggle={toggleRegion}
              placeholder="Agregar regiones"
              title="Seleccionar Regiones"
              locale={locale}
              icon="🌎"
              color="blue"
            />
          </div>

          {/* Temas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              🏷️ {t("topics")}
            </h3>
            <SearchableMultiSelect
              options={topics}
              selectedIds={selectedTopics}
              onToggle={toggleTopic}
              placeholder="Agregar temas"
              title="Seleccionar Temas"
              locale={locale}
              icon="🏷️"
              color="green"
            />
          </div>

          {/* Tipos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              📝 {t("articleTypes")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTypes.includes(type.id)
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  }`}
                >
                  {locale === "es" && type.nameES ? type.nameES : type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Año */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              📅 {t("year")}
            </h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
            >
              <option value="">{t("allYears")}</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
            >
              {t("clearAllFilters")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

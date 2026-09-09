"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaSearch,
  FaGlobeAmericas,
  FaTag,
  FaNewspaper,
  FaCheck,
} from "react-icons/fa";

// Async (no SSR) — mismo patrón que el AsyncSelect del editor (ArticleFormV2.jsx) para
// Autor:in/Gesprächspartner:in/Regionen/Themen. Acá no hace falta "crear nuevo" (es un
// filtro sobre contenido existente, no un formulario de carga), así que loadOptions filtra
// en memoria sobre la lista ya traída (rápido, sin ida y vuelta al servidor por letra).
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

// Rojo de marca (#BD0E0D) para el estado activo/seleccionado en todos los filtros — antes
// cada categoría (región/tema/tipo/año) tenía su propio color genérico de Tailwind
// (azul/verde/púrpura/naranja), lo que además chocaba con la regla de marca "un color = un
// significado" (el verde está reservado para el Digital-Abo). Ahora el color ya no
// distingue el TIPO de filtro — eso lo hace el ícono — y el rojo es siempre "esto está
// activo". El verde de marca (#89B881) queda como acento sutil y puntual: solo el
// check ✓ de una opción ya elegida dentro del dropdown (mismo significado "éxito/
// confirmado" que ya tiene en el resto del sitio, ver SubmitFeedback).
const BRAND_GREEN = "#89B881";

// components + classNames compartidos por los dos AsyncSelect (Regionen/Themen) — un solo
// lugar para el look, cada instancia solo cambia data/labels/ícono.
function makeSelectComponents(Icon) {
  return {
    Option: ({ children, isSelected, isFocused, innerRef, innerProps }) => (
      <div
        ref={innerRef}
        {...innerProps}
        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${
          isSelected
            ? "bg-red-50 dark:bg-red-900/20 text-[#BD0E0D] dark:text-red-300 font-semibold"
            : isFocused
              ? "bg-gray-50 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200"
              : "text-gray-700 dark:text-gray-300"
        }`}
      >
        <span className="truncate">{children}</span>
        {isSelected && (
          <FaCheck className="shrink-0" size={11} style={{ color: BRAND_GREEN }} />
        )}
      </div>
    ),
    MultiValueLabel: ({ children }) => (
      <div className="flex items-center gap-1.5 pl-2 pr-1 py-1 text-[13px] font-medium text-[#BD0E0D] dark:text-red-300">
        <Icon size={10} />
        <span>{children}</span>
      </div>
    ),
  };
}

const SELECT_CLASSNAMES = {
  control: (state) =>
    `min-h-[42px] rounded-lg border bg-white dark:bg-gray-700 transition-colors ${
      state.isFocused
        ? "border-[#BD0E0D] shadow-[0_0_0_1px_#BD0E0D]"
        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
    }`,
  valueContainer: () => "gap-1 py-1 px-2",
  placeholder: () => "text-gray-400 dark:text-gray-500 text-sm",
  input: () => "text-gray-900 dark:text-white text-sm",
  multiValue: () =>
    "flex items-center rounded-full bg-red-50 dark:bg-red-900/30 my-0.5 overflow-hidden",
  multiValueRemove: () =>
    "px-1.5 rounded-r-full text-[#BD0E0D] dark:text-red-300 hover:bg-[#BD0E0D] hover:text-white transition-colors",
  indicatorsContainer: () => "text-gray-400",
  dropdownIndicator: () => "px-2 hover:text-[#BD0E0D] transition-colors",
  clearIndicator: () => "px-1 hover:text-[#BD0E0D] transition-colors",
  indicatorSeparator: () => "hidden",
  menu: () =>
    "mt-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden z-30",
  menuList: () => "py-1 max-h-64",
  noOptionsMessage: () => "px-3 py-4 text-sm text-gray-400",
  loadingMessage: () => "px-3 py-4 text-sm text-gray-400",
};

// Filtros activos: mismo estilo rojo de marca para todas las categorías, diferenciados
// solo por el ícono (ver comentario arriba de AsyncSelect sobre por qué el color ya no
// codifica el tipo de filtro).
const CHIP_CLASS =
  "inline-flex items-center gap-1.5 pl-3 pr-1 py-1 bg-red-50 dark:bg-red-900/20 text-[#BD0E0D] dark:text-red-300 rounded-full text-sm font-medium";
const CHIP_REMOVE_CLASS =
  "rounded-full p-0.5 hover:bg-[#BD0E0D] hover:text-white transition-colors";

export default function AdvancedSearchFilters({ onFiltersChange, locale }) {
  const t = useTranslations("search");
  const [isExpanded, setIsExpanded] = useState(false);

  // Estados de filtros
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Datos disponibles — todas count > 0 (nadie quiere filtrar por una región/tema/tipo sin
  // un solo artículo) y ordenadas por cantidad desc, así lo más relevante aparece primero
  // al abrir el desplegable sin escribir nada.
  const [regions, setRegions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    async function loadFilters() {
      try {
        const [regionsRes, topicsRes, typesRes] = await Promise.all([
          fetch("/api/regions?leafOnly=true"),
          fetch("/api/entities/topics"),
          fetch("/api/entities/beitragstypen"),
        ]);
        const [regionsData, topicsData, typesData] = await Promise.all([
          regionsRes.json(),
          topicsRes.json(),
          typesRes.json(),
        ]);
        // /api/regions no filtra por count (a diferencia de las /api/entities/*) — se hace acá.
        setRegions(
          regionsData
            .filter((r) => (r._count?.articles || 0) > 0)
            .map((r) => ({ id: r.id, name: r.name, nameES: r.nameES, count: r._count.articles }))
            .sort((a, b) => b.count - a.count)
        );
        setTopics(topicsData);
        setTypes(typesData);
      } catch (error) {
        console.error("Error cargando filtros:", error);
      }
    }
    loadFilters();
  }, []);

  // Notificar cambios — `year` se mantiene vacío en el objeto: la selección de año ahora
  // vive en la línea de tiempo (YearTimeline) de SearchResults.js, no acá. Se deja el campo
  // para no tener que tocar el contrato que ya consume SearchResults.js.
  useEffect(() => {
    onFiltersChange({
      regions: selectedRegions,
      topics: selectedTopics,
      types: selectedTypes,
      year: "",
    });
  }, [selectedRegions, selectedTopics, selectedTypes, onFiltersChange]);

  const toggleType = (id) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedRegions([]);
    setSelectedTopics([]);
    setSelectedTypes([]);
  };

  const hasActiveFilters =
    selectedRegions.length > 0 || selectedTopics.length > 0 || selectedTypes.length > 0;

  const activeCount = selectedRegions.length + selectedTopics.length + selectedTypes.length;

  const labelOf = useCallback(
    (item) => (locale === "es" && item.nameES ? item.nameES : item.name),
    [locale]
  );

  // Memoizados: sin esto, cada tilde de un filtro re-renderiza el componente entero →
  // nuevas referencias de array/función en cada AsyncSelect → react-select las toma como
  // "cambiaron las opciones" y puede cerrar el desplegable o perder lo tipeado a mitad de
  // búsqueda en el OTRO select. Solo se recalculan si cambian los datos o el idioma.
  const regionOptions = useMemo(
    () => regions.map((r) => ({ value: r.id, label: labelOf(r) })),
    [regions, labelOf]
  );
  const topicOptions = useMemo(
    () => topics.map((t) => ({ value: t.id, label: labelOf(t) })),
    [topics, labelOf]
  );

  const loadRegionOptions = useCallback(
    (inputValue) => {
      const q = (inputValue || "").trim().toLowerCase();
      const filtered = q
        ? regionOptions.filter((o) => o.label.toLowerCase().includes(q))
        : regionOptions;
      return Promise.resolve(filtered.slice(0, 60));
    },
    [regionOptions]
  );
  const loadTopicOptions = useCallback(
    (inputValue) => {
      const q = (inputValue || "").trim().toLowerCase();
      const filtered = q
        ? topicOptions.filter((o) => o.label.toLowerCase().includes(q))
        : topicOptions;
      return Promise.resolve(filtered.slice(0, 60));
    },
    [topicOptions]
  );

  const regionComponents = useMemo(() => makeSelectComponents(FaGlobeAmericas), []);
  const topicComponents = useMemo(() => makeSelectComponents(FaTag), []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <FaSearch className="text-[#BD0E0D]" size={15} />
            {t("advancedSearch")}
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-red-50 dark:bg-red-900/30 text-[#BD0E0D] dark:text-red-300 text-xs font-medium rounded-full">
              {t("activeFiltersCount", { count: activeCount })}
            </span>
          )}
        </div>
        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
      </button>

      {/* Filtros activos (siempre visibles si hay, panel colapsado) */}
      {hasActiveFilters && !isExpanded && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {selectedRegions.map((id) => {
            const region = regions.find((r) => r.id === id);
            return region ? (
              <span key={`r-${id}`} className={CHIP_CLASS}>
                <FaGlobeAmericas size={11} />
                {labelOf(region)}
                <button
                  onClick={() =>
                    setSelectedRegions((prev) => prev.filter((r) => r !== id))
                  }
                  className={CHIP_REMOVE_CLASS}
                >
                  <FaTimes size={11} />
                </button>
              </span>
            ) : null;
          })}

          {selectedTopics.map((id) => {
            const topic = topics.find((t) => t.id === id);
            return topic ? (
              <span key={`t-${id}`} className={CHIP_CLASS}>
                <FaTag size={11} />
                {labelOf(topic)}
                <button
                  onClick={() => setSelectedTopics((prev) => prev.filter((t) => t !== id))}
                  className={CHIP_REMOVE_CLASS}
                >
                  <FaTimes size={11} />
                </button>
              </span>
            ) : null;
          })}

          {selectedTypes.map((id) => {
            const type = types.find((t) => t.id === id);
            return type ? (
              <span key={`ty-${id}`} className={CHIP_CLASS}>
                <FaNewspaper size={11} />
                {labelOf(type)}
                <button onClick={() => toggleType(id)} className={CHIP_REMOVE_CLASS}>
                  <FaTimes size={11} />
                </button>
              </span>
            ) : null;
          })}

          <button
            onClick={clearFilters}
            className="px-3 py-1 text-[#BD0E0D] dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-sm font-medium transition-colors"
          >
            {t("clearAll")}
          </button>
        </div>
      )}

      {/* Panel expandido */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          {/* Regiones */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaGlobeAmericas className="text-[#BD0E0D]" size={13} />
              {t("regions")}
            </h3>
            <AsyncSelect
              key={`region-${locale}`}
              instanceId="search-region"
              inputId="search-region-select"
              isMulti
              unstyled
              hideSelectedOptions={false}
              cacheOptions
              defaultOptions={regionOptions}
              loadOptions={loadRegionOptions}
              components={regionComponents}
              classNames={SELECT_CLASSNAMES}
              value={regionOptions.filter((o) => selectedRegions.includes(o.value))}
              onChange={(selected) =>
                setSelectedRegions((selected || []).map((o) => o.value))
              }
              placeholder={t("addRegions")}
              noOptionsMessage={() => t("noResultsFound")}
              loadingMessage={() => t("loading")}
            />
          </div>

          {/* Temas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaTag className="text-[#BD0E0D]" size={13} />
              {t("topics")}
            </h3>
            <AsyncSelect
              key={`topic-${locale}`}
              instanceId="search-topic"
              inputId="search-topic-select"
              isMulti
              unstyled
              hideSelectedOptions={false}
              cacheOptions
              defaultOptions={topicOptions}
              loadOptions={loadTopicOptions}
              components={topicComponents}
              classNames={SELECT_CLASSNAMES}
              value={topicOptions.filter((o) => selectedTopics.includes(o.value))}
              onChange={(selected) =>
                setSelectedTopics((selected || []).map((o) => o.value))
              }
              placeholder={t("addTopics")}
              noOptionsMessage={() => t("noResultsFound")}
              loadingMessage={() => t("loading")}
            />
          </div>

          {/* Tipos — pocas opciones (~6-10), se quedan como pills de toggle directo, sin
              desplegable: abrir un select para elegir entre 6 cosas es más fricción, no menos. */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <FaNewspaper className="text-[#BD0E0D]" size={13} />
              {t("articleTypes")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTypes.includes(type.id)
                      ? "bg-[#BD0E0D] text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  }`}
                >
                  {labelOf(type)}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2 text-[#BD0E0D] dark:text-red-300 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
            >
              {t("clearAllFilters")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

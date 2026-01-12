// components/dashboard/ArticleSelector.jsx
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import dynamic from "next/dynamic";
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export default function ArticleSelector({
  onArticlesSelected,
  initialSelectedArticles = [],
  showFilters = true,
  maxSelections = Infinity,
  allowReordering = true,
  includeNurOnline = true,
  includeByAuthor = true,
  includeAllPublished = true,
}) {
  const locale = useLocale();

  // Estados para datos
  const [dossiers, setDossiers] = useState([]);
  const [types, setTypes] = useState([]);
  const [regions, setRegions] = useState([]);
  const [categories, setCategories] = useState([]);

  // Estados para selección
  const [selectedDossierId, setSelectedDossierId] = useState("");
  const [dossierArticles, setDossierArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState(
    initialSelectedArticles
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  // Estados para filtros
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [availableOnlyOnline, setAvailableOnlyOnline] = useState(false);

  // Estados de carga
  const [loadingData, setLoadingData] = useState(true);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [dossiersRes, typesRes, regionsRes, categoriesRes] =
          await Promise.all([
            fetch("/api/editions").then((r) => r.json()),
            fetch("/api/beitragstypen").then((r) => r.json()),
            fetch("/api/regions").then((r) => r.json()),
            fetch("/api/categories").then((r) => r.json()),
          ]);

        const editionsArray = Array.isArray(dossiersRes)
          ? dossiersRes
          : dossiersRes.editions || [];
        setDossiers(editionsArray.sort((a, b) => b.number - a.number));

        setTypes(typesRes || []);
        setRegions(regionsRes || []);
        setCategories(categoriesRes || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  // Notificar al padre
  useEffect(() => {
    onArticlesSelected(selectedArticles);
  }, [selectedArticles, onArticlesSelected]);

  // Cargar artículos
  const loadArticles = async (dossierId, author = null) => {
    setLoadingArticles(true);
    try {
      let url = "";
      if (dossierId === "nur-online") {
        url = `/api/articles/list?nurOnline=true&limit=200`;
      } else if (dossierId === "por-autor" && author) {
        url = `/api/articles/list?authorId=${author.value}&limit=200`;
      } else if (dossierId === "todos") {
        url = `/api/articles/list?limit=300`;
      } else if (dossierId && dossierId !== "por-autor") {
        url = `/api/articles/list?editionId=${dossierId}&limit=200`;
      }

      if (url) {
        const response = await fetch(url);
        const data = await response.json();
        let articles = [];
        if (
          dossierId === "todos" ||
          dossierId === "nur-online" ||
          dossierId === "por-autor"
        ) {
          articles = data.articles || data || [];
        } else {
          articles = data.articles || [];
        }

        const publishedArticles = articles.filter((a) => a.isPublished);
        let filteredArticles = publishedArticles;

        if (showFilters) {
          if (availableOnlyOnline) {
            filteredArticles = filteredArticles.filter((a) => a.isNurOnline);
          }
          if (selectedTypeId) {
            filteredArticles = filteredArticles.filter(
              (a) => a.beitragstypId === parseInt(selectedTypeId)
            );
          }
          if (selectedRegionId) {
            filteredArticles = filteredArticles.filter(
              (a) => a.regionId === parseInt(selectedRegionId)
            );
          }
          if (selectedCategoryIds.length > 0) {
            filteredArticles = filteredArticles.filter((a) =>
              a.categories?.some((cat) => selectedCategoryIds.includes(cat.id))
            );
          }
        }
        setDossierArticles(filteredArticles);
      } else {
        setDossierArticles([]);
      }
    } catch (error) {
      console.error("Error cargando artículos:", error);
      setDossierArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    if (selectedDossierId) {
      loadArticles(selectedDossierId, selectedAuthor);
    } else {
      setDossierArticles([]);
    }
  }, [
    selectedDossierId,
    selectedAuthor,
    availableOnlyOnline,
    selectedTypeId,
    selectedRegionId,
    selectedCategoryIds,
  ]);

  const loadAuthors = async (inputValue) => {
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) return [];
      const data = await res.json();
      const filtered = data.filter((a) =>
        a.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      return filtered.map((a) => ({ value: a.id, label: a.name }));
    } catch (error) {
      console.error("Error cargando autores:", error);
      return [];
    }
  };

  const filterArticles = () => {
    return dossierArticles.filter((article) => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = article.title.toLowerCase().includes(searchLower);
      const subtitleMatch = article.subtitle
        ?.toLowerCase()
        .includes(searchLower);
      const authorMatch = article.authors?.some((author) =>
        author.name.toLowerCase().includes(searchLower)
      );
      return titleMatch || subtitleMatch || authorMatch;
    });
  };

  const toggleSelectAll = () => {
    const filtered = filterArticles();
    if (
      maxSelections !== Infinity &&
      !filtered.every((article) =>
        selectedArticles.some((s) => s.id === article.id)
      ) &&
      selectedArticles.length + filtered.length > maxSelections
    ) {
      alert(`Solo puedes seleccionar hasta ${maxSelections} artículos`);
      return;
    }
    const allSelected = filtered.every((article) =>
      selectedArticles.some((s) => s.id === article.id)
    );
    if (allSelected) {
      const filteredIds = filtered.map((a) => a.id);
      setSelectedArticles(
        selectedArticles.filter((s) => !filteredIds.includes(s.id))
      );
    } else {
      const newArticles = filtered.filter(
        (article) => !selectedArticles.some((s) => s.id === article.id)
      );
      setSelectedArticles([...selectedArticles, ...newArticles]);
    }
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (dragIndex === dropIndex) return;
    const newList = [...selectedArticles];
    const [draggedItem] = newList.splice(dragIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);
    setSelectedArticles(newList);
  };

  const renderRegionOptions = (list, depth = 0) => {
    return list.flatMap((region) => [
      <option key={region.id} value={region.id}>
        {"— ".repeat(depth) + region.name}
      </option>,
      ...renderRegionOptions(region.children || [], depth + 1),
    ]);
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const filtered = filterArticles();

  return (
    <div className="space-y-4">
      {/* --- 1. SELECTOR DE ORIGEN (Compacto) --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-12 gap-3 items-center">
          <label className="col-span-12 sm:col-span-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Origen:
          </label>
          <div className="col-span-12 sm:col-span-9">
            <select
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              value={selectedDossierId}
              onChange={(e) => {
                setSelectedDossierId(e.target.value);
                setSelectedAuthor(null);
              }}
            >
              <option value="">-- Seleccionar origen --</option>
              {includeAllPublished && (
                <option value="todos">🌐 Todos los artículos publicados</option>
              )}
              {includeNurOnline && (
                <option value="nur-online">📱 Solo Nur Online</option>
              )}
              {includeByAuthor && (
                <option value="por-autor">✍️ Por Autor</option>
              )}
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.number} -{" "}
                  {locale === "es" && d.titleES ? d.titleES : d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de autor (condicional) */}
        {selectedDossierId === "por-autor" && (
          <div className="mt-3">
            <AsyncSelect
              instanceId="author-selector"
              cacheOptions
              defaultOptions
              loadOptions={loadAuthors}
              value={selectedAuthor}
              onChange={setSelectedAuthor}
              placeholder="Escribe el nombre del autor..."
              isClearable
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "rgb(255 255 255 / var(--tw-bg-opacity))",
                  borderColor: "rgb(209 213 219 / var(--tw-border-opacity))",
                  minHeight: "42px",
                  "&:hover": {
                    borderColor: "rgb(156 163 175 / var(--tw-border-opacity))",
                  },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "rgb(255 255 255 / var(--tw-bg-opacity))",
                  zIndex: 9999,
                }),
              }}
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        )}
      </div>

      {/* --- 2. BÚSQUEDA + SELECCIÓN (All-in-One) --- */}
      {selectedDossierId && dossierArticles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          {/* Header: Título + Búsqueda + Botón */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Artículos
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                  ({filtered.length})
                </span>
              </h3>
              {maxSelections !== Infinity && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  Máx {maxSelections}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <input
                type="text"
                placeholder="Buscar..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="button"
                onClick={toggleSelectAll}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap"
              >
                {filtered.every((article) =>
                  selectedArticles.some((s) => s.id === article.id)
                )
                  ? "Deseleccionar"
                  : "Seleccionar todos"}
              </button>
            </div>
          </div>

          {/* --- 3. LISTADO DE ARTÍCULOS (Horizontal Compacto) --- */}
          {loadingArticles ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No se encontraron artículos.
                </div>
              ) : (
                filtered.map((article) => {
                  const isSelected = selectedArticles.some(
                    (s) => s.id === article.id
                  );
                  const authorName =
                    article.authors?.map((a) => a.name).join(", ") || "";

                  return (
                    <div
                      key={article.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedArticles(
                            selectedArticles.filter((s) => s.id !== article.id)
                          );
                        } else {
                          if (selectedArticles.length >= maxSelections) {
                            alert(
                              `Solo puedes seleccionar hasta ${maxSelections} artículos`
                            );
                            return;
                          }
                          setSelectedArticles([...selectedArticles, article]);
                        }
                      }}
                      className={`
                        flex items-center justify-between p-3 cursor-pointer transition-all border-b border-gray-100 dark:border-gray-800 last:border-0
                        ${
                          isSelected
                            ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-transparent"
                        }
                      }
                      `}
                    >
                      {/* Columna Izquierda: Info Texto */}
                      <div className="flex-1 min-w-0 pr-2">
                        <h4
                          className={`text-sm font-bold leading-snug mb-1 truncate ${isSelected ? "text-red-900 dark:text-red-100" : "text-gray-900 dark:text-white"}`}
                        >
                          {article.title}
                        </h4>
                        {article.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
                            {article.subtitle}
                          </p>
                        )}
                        {authorName && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-gray-400">
                              ✍️
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {authorName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Columna Derecha: Badges + Checkbox */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Badges Compactos */}
                        <div className="flex items-center gap-1">
                          {article.edition && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded font-medium">
                              #{article.edition.number}
                            </span>
                          )}
                          {article.isNurOnline && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded font-medium">
                              🌐
                            </span>
                          )}
                          {article.beitragstyp && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded font-medium">
                              {locale === "es" && article.beitragstyp.nameES
                                ? article.beitragstyp.nameES
                                : article.beitragstyp.name}
                            </span>
                          )}
                        </div>

                        {/* Checkbox Visual */}
                        <div
                          className={`
                          w-5 h-5 rounded flex items-center justify-center border transition-colors
                          ${
                            isSelected
                              ? "bg-red-600 border-red-600"
                              : "bg-white border-gray-300 dark:border-gray-600"
                          }
                        `}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* --- 4. FILTROS AVANZADOS (Colapsable) --- */}
      {showFilters &&
        selectedDossierId &&
        selectedDossierId !== "por-autor" && (
          <details className="group bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors list-none">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="group-open:hidden">▶</span>
                <span className="group-open:inline hidden">▼</span>
                Filtros avanzados
              </span>
              <span className="text-xs text-gray-400">(Opcional)</span>
            </summary>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Toggle Nur Online */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={availableOnlyOnline}
                    onChange={(e) => setAvailableOnlyOnline(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Solo Nur Online
                  </span>
                </div>

                {/* Tipo */}
                <div>
                  <select
                    className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={selectedTypeId}
                    onChange={(e) => setSelectedTypeId(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {locale === "es" && type.nameES
                          ? type.nameES
                          : type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Región */}
                <div>
                  <select
                    className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={selectedRegionId}
                    onChange={(e) => setSelectedRegionId(e.target.value)}
                  >
                    <option value="">Todas las regiones</option>
                    {renderRegionOptions(regions)}
                  </select>
                </div>

                {/* Categorías */}
                <div>
                  <select
                    multiple
                    className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-24"
                    value={selectedCategoryIds.map(String)}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions).map(
                        (o) => parseInt(o.value, 10)
                      );
                      setSelectedCategoryIds(values);
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {locale === "es" && cat.nameES ? cat.nameES : cat.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Ctrl+clic para varios
                  </p>
                </div>
              </div>
            </div>
          </details>
        )}

      {/* --- 5. ARTÍCULOS SELECCIONADOS (Compacto) --- */}
      {selectedArticles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Seleccionados
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                  ({selectedArticles.length})
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedArticles([])}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Limpiar
            </button>
          </div>

          {allowReordering && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Arrastra para reordenar
            </div>
          )}

          <div className="space-y-1">
            {selectedArticles.map((article, index) => (
              <div
                key={article.id}
                draggable={allowReordering}
                onDragStart={
                  allowReordering ? (e) => handleDragStart(e, index) : undefined
                }
                onDragOver={allowReordering ? handleDragOver : undefined}
                onDrop={
                  allowReordering ? (e) => handleDrop(e, index) : undefined
                }
                className="group flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all"
              >
                {allowReordering && (
                  <span className="text-gray-300 group-hover:text-gray-500 text-sm cursor-grab active:cursor-grabbing">
                    ⋮⋮
                  </span>
                )}

                {/* Numero ordinal */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-[10px] font-bold text-gray-500 dark:text-gray-400 shadow-sm">
                  {index + 1}
                </div>

                {/* Info compacta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {article.title}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {article.edition
                      ? `Dossier #${article.edition.number}`
                      : "Nur Online"}
                  </p>
                </div>

                {/* Botón quitar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArticles(
                      selectedArticles.filter((s) => s.id !== article.id)
                    );
                  }}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

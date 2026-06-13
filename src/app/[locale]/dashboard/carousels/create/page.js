"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import ArticleCarousel from "../../../components/Articles/ArticleCarousel/ArticleCarousel";
import ArticleCarouselVer from "../../../components/Articles/ArticleCarouselVer/ArticleCarouselVer";
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export default function CreateCarouselPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.Carousels");

  const [titleES, setTitleES] = useState("");
  const [titleDE, setTitleDE] = useState("");
  const [placement, setPlacement] = useState("after");

  const [types, setTypes] = useState([]);
  const [beitragstypId, setBeitragstypId] = useState("");

  const [regions, setRegions] = useState([]);
  const [regionId, setRegionId] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const [limit, setLimit] = useState(6);
  // 🆕 Estados para carrusel manual
  const [isManual, setIsManual] = useState(false);
  const [selectedDossierId, setSelectedDossierId] = useState("");
  const [dossiers, setDossiers] = useState([]);
  const [dossierArticles, setDossierArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState(null);

  // Cargar tipos, regiones y categorías
  useEffect(() => {
    fetch("/api/beitragstypen")
      .then((r) => r.json())
      .then(setTypes);
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegions);
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
    fetch("/api/editions")
      .then((r) => r.json())
      .then((data) => {
        const editionsArray = Array.isArray(data) ? data : data.editions || [];
        setDossiers(editionsArray.sort((a, b) => b.number - a.number));
      });
  }, []);

  // 🆕 Cargar artículos del dossier seleccionado con toda la info
  useEffect(() => {
    if (isManual && selectedDossierId) {
      if (selectedDossierId === "nur-online") {
        fetch(`/api/articles/list?nurOnline=true&limit=100`)
          .then((r) => r.json())
          .then((data) => {
            const publishedArticles = (data.articles || []).filter(
              (a) => a.isPublished
            );
            setDossierArticles(publishedArticles);
          })
          .catch(() => setDossierArticles([]));
      } else if (selectedDossierId === "por-autor") {
        // No cargar nada aquí, se carga cuando seleccionen un autor
        setDossierArticles([]);
      } else {
        fetch(`/api/editions/${selectedDossierId}?includeArticles=true`)
          .then((r) => r.json())
          .then((edition) => {
            const publishedArticles = (edition.articles || []).filter(
              (a) => a.isPublished
            );
            setDossierArticles(publishedArticles);
          })
          .catch(() => setDossierArticles([]));
      }
    } else {
      setDossierArticles([]);
    }
  }, [isManual, selectedDossierId]);
  useEffect(() => {
    if (isManual && selectedDossierId === "por-autor" && selectedAuthor) {
      fetch(`/api/articles/list?authorId=${selectedAuthor.value}&limit=100`)
        .then((r) => r.json())
        .then((data) => {
          const publishedArticles = (data.articles || []).filter(
            (a) => a.isPublished
          );
          setDossierArticles(publishedArticles);
        })
        .catch(() => setDossierArticles([]));
    }
  }, [isManual, selectedDossierId, selectedAuthor]);

  function renderRegionOptions(list, depth = 0) {
    return list.flatMap((region) => [
      <option key={region.id} value={region.id}>
        {"— ".repeat(depth) + region.name}
      </option>,
      ...renderRegionOptions(region.children || [], depth + 1),
    ]);
  }

  // 🆕 Funciones para drag-and-drop
  function handleDragStart(e, index) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e, dropIndex) {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (dragIndex === dropIndex) return;

    const newList = [...selectedArticles];
    const [draggedItem] = newList.splice(dragIndex, 1);
    newList.splice(dropIndex, 0, draggedItem);
    setSelectedArticles(newList);
  }
  const loadAuthors = async (inputValue) => {
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) return [];

      const data = await res.json();

      const filtered = data.filter((a) =>
        a.name.toLowerCase().includes(inputValue.toLowerCase())
      );

      return filtered.map((a) => ({
        value: a.id,
        label: a.name,
      }));
    } catch (error) {
      console.error("Error cargando autores:", error);
      return [];
    }
  };
  // 🆕 Función de búsqueda mejorada
  function filterArticles() {
    return dossierArticles.filter((article) => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = article.title.toLowerCase().includes(searchLower);
      const authorMatch = article.authors?.some((author) =>
        author.name.toLowerCase().includes(searchLower)
      );
      return titleMatch || authorMatch;
    });
  }

  // 🆕 Seleccionar/deseleccionar todos
  function toggleSelectAll() {
    const filtered = filterArticles();
    const allSelected = filtered.every((article) =>
      selectedArticles.some((s) => s.id === article.id)
    );

    if (allSelected) {
      // Deseleccionar todos los filtrados
      const filteredIds = filtered.map((a) => a.id);
      setSelectedArticles(
        selectedArticles.filter((s) => !filteredIds.includes(s.id))
      );
    } else {
      // Seleccionar todos los filtrados que no están ya seleccionados
      const newArticles = filtered.filter(
        (article) => !selectedArticles.some((s) => s.id === article.id)
      );
      setSelectedArticles([...selectedArticles, ...newArticles]);
    }
  }

  function onChangeCategories(e) {
    const values = Array.from(e.target.selectedOptions).map((o) =>
      parseInt(o.value, 10)
    );
    setSelectedCategoryIds(values);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      titleES,
      titleDE,
      limit: isManual ? selectedArticles.length : limit,
      isManual,
      placement,
      carouselType: beitragstypId === "2" ? "vertical" : "horizontal",
    };

    if (isManual) {
      // Carrusel manual: enviar IDs y posiciones de artículos
      payload.articleIds = selectedArticles.map((a) => a.id);
    } else {
      // Carrusel automático: enviar filtros
      payload.beitragstypId = beitragstypId
        ? parseInt(beitragstypId, 10)
        : null;
      payload.regionId = regionId ? parseInt(regionId, 10) : null;
      payload.categoryIds = selectedCategoryIds;
    }

    const res = await fetch("/api/carousels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/dashboard/carousels");
    } else {
      const msg = await res.text();
      alert(`${t("createError")}: ${msg}`);
    }
  }

  // Mismo criterio que el submit: tipo 2 => carrusel vertical (portadas)
  const previewType = beitragstypId === "2" ? "vertical" : "horizontal";
  const previewTitle = String(locale).toLowerCase().startsWith("de")
    ? titleDE || titleES
    : titleES || titleDE;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        {/* Título (alemán) */}
        <div className="grid grid-cols-12 gap-3 items-center">
          <label
            htmlFor="titleDE"
            className="col-span-4 text-sm font-medium text-gray-700"
          >
            {t("titleDELabel")}
          </label>
          <input
            id="titleDE"
            type="text"
            placeholder={t("titleDEPlaceholder")}
            className="col-span-8 w-full border p-2 rounded"
            value={titleDE}
            onChange={(e) => setTitleDE(e.target.value)}
          />
        </div>

        {/* Título (español) */}
        <div className="grid grid-cols-12 gap-3 items-center">
          <label
            htmlFor="titleES"
            className="col-span-4 text-sm font-medium text-gray-700"
          >
            {t("titleESLabel")}
          </label>
          <input
            id="titleES"
            type="text"
            placeholder={t("titleESPlaceholder")}
            className="col-span-8 w-full border p-2 rounded"
            value={titleES}
            onChange={(e) => setTitleES(e.target.value)}
          />
        </div>

        {/* 🆕 Selector: Manual vs Automático */}
        <div className="grid grid-cols-12 gap-3 items-center border-t pt-4">
          <label className="col-span-4 text-sm font-medium text-gray-700">
            {t("carouselTypeLabel") || "Tipo de carrusel"}
          </label>
          <div className="col-span-8 flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="carouselType"
                checked={!isManual}
                onChange={() => {
                  setIsManual(false);
                  setSelectedArticles([]);
                }}
                className="w-4 h-4"
              />
              <span>{t("automatic") || "Automático (por filtros)"}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="carouselType"
                checked={isManual}
                onChange={() => {
                  setIsManual(true);
                  setBeitragstypId("");
                  setRegionId("");
                  setSelectedCategoryIds([]);
                }}
                className="w-4 h-4"
              />
              <span>{t("manual") || "Manual (selección de artículos)"}</span>
            </label>
          </div>
        </div>

        {/* 🆕 Selector de ubicación */}
        <div className="grid grid-cols-12 gap-3 items-center">
          <label
            htmlFor="placement"
            className="col-span-4 text-sm font-medium text-gray-700"
          >
            {t("placementLabel") || "Ubicación en página"}
          </label>
          <select
            id="placement"
            className="col-span-8 w-full border p-2 rounded"
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
          >
            <option value="top">
              {t("placementTop") || "🔝 Arriba (antes de ediciones)"}
            </option>
            <option value="after">
              {t("placementAfter") || "📰 Después de ediciones (normal)"}
            </option>
          </select>
          <div className="col-start-5 col-span-8">
            <p className="text-xs text-gray-500 mt-1">
              {placement === "top"
                ? "Este carrusel aparecerá debajo del banner promocional, antes de las ediciones"
                : "Este carrusel aparecerá después de las ediciones (ubicación estándar)"}
            </p>
          </div>
        </div>

        {/* Filtros automáticos - solo si NO es manual */}
        {!isManual && (
          <>
            {/* Tipo de contenido (opcional) */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label
                htmlFor="type"
                className="col-span-4 text-sm font-medium text-gray-700"
              >
                {t("typeLabelOption")}
              </label>
              <select
                id="type"
                className="col-span-8 w-full border p-2 rounded"
                value={beitragstypId}
                onChange={(e) => setBeitragstypId(e.target.value)}
              >
                <option value="">{t("noTypeOption")}</option>
                {types.map((t1) => (
                  <option key={t1.id} value={t1.id}>
                    {locale === "es" && t1.nameES ? t1.nameES : t1.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Región (opcional) */}
            <div className="grid grid-cols-12 gap-3 items-center">
              <label
                htmlFor="region"
                className="col-span-4 text-sm font-medium text-gray-700"
              >
                {t("regionLabelOption")}
              </label>
              <select
                id="region"
                className="col-span-8 w-full border p-2 rounded"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              >
                <option value="">{t("regionNone")}</option>
                {renderRegionOptions(regions)}
              </select>
            </div>

            {/* Categorías (opcional) */}
            <div className="grid grid-cols-12 gap-3 items-start">
              <label
                htmlFor="categories"
                className="col-span-4 text-sm font-medium text-gray-700"
              >
                {t("categoriesLabel")}
              </label>
              <div className="col-span-8">
                <select
                  id="categories"
                  multiple
                  className="w-full border p-2 rounded h-40"
                  value={selectedCategoryIds.map(String)}
                  onChange={onChangeCategories}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {locale === "es" && c.nameES ? c.nameES : c.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {t("categoriesHint")}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 🆕 Selector de dossier - solo si ES manual */}
        {isManual && (
          <>
            <div className="grid grid-cols-12 gap-3 items-center">
              <label
                htmlFor="dossier"
                className="col-span-4 text-sm font-medium text-gray-700"
              >
                {t("selectDossier") || "Seleccionar Dossier"}
              </label>
              <select
                id="dossier"
                className="col-span-8 w-full border p-2 rounded"
                value={selectedDossierId}
                onChange={(e) => {
                  setSelectedDossierId(e.target.value);
                  setSelectedAuthor(null);
                  setDossierArticles([]);
                }}
              >
                <option value="">
                  {t("chooseDossier") || "-- Elige un dossier --"}
                </option>
                <option value="nur-online">🌐 Nur Online</option>
                <option value="por-autor">✍️ Por Autor</option>
                {dossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.number} -{" "}
                    {locale === "es" && d.titleES ? d.titleES : d.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Búsqueda de artículos */}
            {/* Selector de autor */}
            {selectedDossierId === "por-autor" && (
              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-4 text-sm font-medium text-gray-700">
                  {t("selectAuthor") || "Buscar autor"}
                </label>
                <div className="col-span-8">
                  <AsyncSelect
                    instanceId="author-carousel"
                    cacheOptions
                    defaultOptions
                    loadOptions={loadAuthors}
                    value={selectedAuthor}
                    onChange={(selected) => {
                      setSelectedAuthor(selected);
                    }}
                    placeholder={
                      t("authorPlaceholder") || "Escribe el nombre del autor..."
                    }
                    isClearable
                  />
                </div>
              </div>
            )}

            {/* Búsqueda de artículos */}
            {((selectedDossierId && selectedDossierId !== "por-autor") ||
              (selectedDossierId === "por-autor" && selectedAuthor)) && (
              <div className="grid grid-cols-12 gap-3 items-start">
                <label
                  htmlFor="search"
                  className="col-span-4 text-sm font-medium text-gray-700"
                >
                  {t("searchArticles") || "Buscar artículos"}
                </label>
                <div className="col-span-8 space-y-3">
                  <input
                    id="search"
                    type="text"
                    placeholder={
                      t("searchPlaceholder") || "Buscar por título..."
                    }
                    className="w-full border p-2 rounded"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  {/* Botón seleccionar todos */}
                  {filterArticles().length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition"
                    >
                      {filterArticles().every((article) =>
                        selectedArticles.some((s) => s.id === article.id)
                      )
                        ? "✓ Deseleccionar todos"
                        : "Seleccionar todos"}
                    </button>
                  )}

                  <div className="max-h-96 overflow-y-auto border rounded p-2 space-y-2">
                    {filterArticles().length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        No se encontraron artículos
                      </p>
                    ) : (
                      filterArticles().map((article) => {
                        const isSelected = selectedArticles.some(
                          (s) => s.id === article.id
                        );
                        const authorNames = article.authors
                          ?.map((a) => a.name)
                          .join(", ");

                        return (
                          <div
                            key={article.id}
                            className={`p-3 rounded cursor-pointer transition-all ${
                              isSelected
                                ? "bg-red-50 border-2 border-red-400 shadow-sm"
                                : "bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedArticles(
                                  selectedArticles.filter(
                                    (s) => s.id !== article.id
                                  )
                                );
                              } else {
                                setSelectedArticles([
                                  ...selectedArticles,
                                  article,
                                ]);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="mt-1 pointer-events-none w-4 h-4"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                                  {article.title}
                                </h4>
                                {article.subtitle && (
                                  <p className="text-xs text-gray-600 mt-0.5 italic">
                                    {article.subtitle}
                                  </p>
                                )}
                                {authorNames && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    📝 {authorNames}
                                  </p>
                                )}
                                {article.beitragstyp && (
                                  <span className="inline-block mt-1 text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                    {locale === "es" &&
                                    article.beitragstyp.nameES
                                      ? article.beitragstyp.nameES
                                      : article.beitragstyp.name}
                                  </span>
                                )}
                                {/* 🆕 Indicador de imagen */}
                                <span
                                  className={`inline-block mt-1 ml-1 text-[10px] px-2 py-0.5 rounded font-medium ${
                                    article.hasImage
                                      ? "bg-green-100 text-green-700"
                                      : "bg-orange-100 text-orange-700"
                                  }`}
                                  title={
                                    article.hasImage
                                      ? "Tiene imagen"
                                      : "Sin imagen"
                                  }
                                >
                                  {article.hasImage
                                    ? "📷 Con imagen"
                                    : "⚠️ Sin imagen"}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="text-red-600 text-lg">✓</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Lista de artículos seleccionados con drag-and-drop */}
            {selectedArticles.length > 0 && (
              <div className="grid grid-cols-12 gap-3 items-start">
                <label className="col-span-4 text-sm font-medium text-gray-700">
                  {t("selectedArticles") || "Artículos seleccionados"} (
                  {selectedArticles.length})
                </label>
                <div className="col-span-8 space-y-2">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <span>💡</span>
                    <span>Arrastra para reordenar</span>
                  </div>
                  {selectedArticles.map((article, index) => (
                    <div
                      key={article.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="group flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-lg shadow-sm cursor-move hover:shadow-lg hover:border-red-300 transition-all"
                    >
                      <span className="text-gray-300 group-hover:text-gray-500 text-xl cursor-grab active:cursor-grabbing">
                        ⋮⋮
                      </span>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {article.title}
                        </p>
                        {article.authors && article.authors.length > 0 && (
                          <p className="text-xs text-gray-500 truncate">
                            ✍️ {article.authors.map((a) => a.name).join(", ")}
                          </p>
                        )}
                        {article.edition ? (
                          <p className="text-xs text-gray-400 truncate">
                            📁 Dossier #{article.edition.number}:{" "}
                            {article.edition.title}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 truncate">
                            🌐 Nur Online
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArticles(
                            selectedArticles.filter((s) => s.id !== article.id)
                          );
                        }}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-100 text-red-600 hover:text-red-800 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Límite - solo para automático */}
        {!isManual && (
          <div className="grid grid-cols-12 gap-3 items-center">
            <label
              htmlFor="limit"
              className="col-span-4 text-sm font-medium text-gray-700"
            >
              {t("limitLabel")}
            </label>
            <input
              id="limit"
              type="number"
              min={1}
              max={20}
              placeholder={t("limitPlaceholder")}
              className="col-span-8 w-full border p-2 rounded"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {t("createButton")}
          </button>
        </div>
      </form>

      {/* Vista previa WYSIWYG — se renderiza igual que en la landing */}
      {((!isManual && (regionId || beitragstypId)) ||
        (isManual && selectedArticles.length > 0)) && (
        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-bold mb-1">{t("previewTitle")}</h2>
          <p className="text-xs text-gray-500 mb-4">
            {t("previewHint") ||
              "Así se verá el carrusel en la página (vista real)."}
          </p>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {previewType === "vertical" ? (
              <ArticleCarouselVer
                beitragstypId={beitragstypId ? parseInt(beitragstypId, 10) : null}
                region={regionId ? parseInt(regionId, 10) : null}
                title={previewTitle}
                limit={isManual ? selectedArticles.length : limit}
                slidesToShow={5}
                isManual={isManual}
                manualArticles={isManual ? selectedArticles : null}
              />
            ) : (
              <ArticleCarousel
                beitragstypId={beitragstypId ? parseInt(beitragstypId, 10) : null}
                region={regionId ? parseInt(regionId, 10) : null}
                title={previewTitle}
                limit={isManual ? selectedArticles.length : limit}
                slidesToShow={4}
                isManual={isManual}
                manualArticles={isManual ? selectedArticles : null}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });
import { useLocale, useTranslations } from "next-intl";

export default function EditCarouselPage() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("dashboard.Carousels");
  const locale = useLocale();

  const [carousel, setCarousel] = useState(null);
  const [types, setTypes] = useState([]);
  const [regions, setRegions] = useState([]);

  // Para vista previa (no se persisten aún)
  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);

  // 🆕 Estados para carrusel manual
  const [isManual, setIsManual] = useState(false);
  const [selectedDossierId, setSelectedDossierId] = useState("");
  const [dossiers, setDossiers] = useState([]);
  const [dossierArticles, setDossierArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  // Cargar carrusel + selects
  useEffect(() => {
    if (!id) return;

    fetch(`/api/carousels/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCarousel({
          ...data,
          titleES: data.titleES || "",
          titleDE: data.titleDE || "",
          beitragstypId: data.beitragstypId ?? "",
          regionId: data.regionId ? Number(data.regionId) : null,
          limit: data.limit ?? 6,
        });

        // 👇 Inicializar categorías seleccionadas
        if (Array.isArray(data.categories)) {
          setSelectedCategoryIds(data.categories.map((c) => c.id));
        }

        // 🆕 Inicializar carrusel manual si aplica
        if (data.isManual) {
          setIsManual(true);
          if (data.articles && Array.isArray(data.articles)) {
            const manualArticles = data.articles
              .sort((a, b) => a.position - b.position)
              .map((ca) => ca.article);
            setSelectedArticles(manualArticles);
          }
        }
      });

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
  }, [id]);

  // Vista previa: filtra por region, tipo y categorías (solo preview)
  useEffect(() => {
    if (!carousel) return;

    const query = new URLSearchParams();
    if (carousel.regionId) query.append("regionId", String(carousel.regionId));
    if (carousel.beitragstypId)
      query.append("beitragstypId", String(carousel.beitragstypId));
    selectedCategoryIds.forEach((cid) =>
      query.append("categoryId", String(cid))
    );

    if (query.toString()) {
      fetch(`/api/articles/filtered?${query.toString()}`)
        .then((res) => res.json())
        .then((data) => setFilteredArticles(Array.isArray(data) ? data : []))
        .catch(() => setFilteredArticles([]));
    } else {
      setFilteredArticles([]);
    }
  }, [carousel, selectedCategoryIds]);

  // 🆕 Cargar artículos del dossier seleccionado
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

  function onChangeCategories(e) {
    const values = Array.from(e.target.selectedOptions).map((o) =>
      parseInt(o.value, 10)
    );
    setSelectedCategoryIds(values);
  }

  function renderRegionOptions(list, depth = 0) {
    return list.flatMap((region) => [
      <option key={region.id} value={region.id.toString()}>
        {"— ".repeat(depth) + region.name}
      </option>,
      ...(region.children
        ? renderRegionOptions(region.children, depth + 1)
        : []),
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

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      titleES: carousel.titleES,
      titleDE: carousel.titleDE,
      limit: isManual ? selectedArticles.length : Number(carousel.limit) || 6,
      isManual,
    };

    if (isManual) {
      // Carrusel manual: enviar IDs y posiciones de artículos
      payload.articleIds = selectedArticles.map((a) => a.id);
    } else {
      // Carrusel automático: enviar filtros
      payload.beitragstypId = carousel.beitragstypId
        ? Number(carousel.beitragstypId)
        : null;
      payload.regionId = carousel.regionId ? Number(carousel.regionId) : null;
      payload.categoryIds = selectedCategoryIds;
    }

    const res = await fetch(`/api/carousels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push("/dashboard/carousels");
    } else {
      alert(t("saveError") || "Error al guardar");
    }
  }

  if (!carousel || regions.length === 0) return <p>{t("loading")}</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">{t("editTitle")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={carousel.titleDE}
            onChange={(e) =>
              setCarousel({ ...carousel, titleDE: e.target.value })
            }
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
            value={carousel.titleES}
            onChange={(e) =>
              setCarousel({ ...carousel, titleES: e.target.value })
            }
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
                }}
                className="w-4 h-4"
              />
              <span>{t("manual") || "Manual (selección de artículos)"}</span>
            </label>
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
                value={String(carousel.beitragstypId ?? "")}
                onChange={(e) =>
                  setCarousel({
                    ...carousel,
                    beitragstypId: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              >
                <option value="">{t("noTypeOption")}</option>
                {types.map((type) => (
                  <option key={type.id} value={String(type.id)}>
                    {locale === "es" && type.nameES ? type.nameES : type.name}
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
                value={
                  typeof carousel.regionId === "number"
                    ? String(carousel.regionId)
                    : carousel.regionId || ""
                }
                onChange={(e) =>
                  setCarousel({
                    ...carousel,
                    regionId: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">{t("regionNone")}</option>
                {renderRegionOptions(regions)}
              </select>
            </div>

            {/* Categorías (multi‑select) — SOLO PREVIEW */}
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

            {/* Selector de autor */}
            {selectedDossierId === "por-autor" && (
              <div className="grid grid-cols-12 gap-3 items-center">
                <label className="col-span-4 text-sm font-medium text-gray-700">
                  {t("selectAuthor") || "Buscar autor"}
                </label>
                <div className="col-span-8">
                  <AsyncSelect
                    instanceId="author-carousel-edit"
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
              value={carousel.limit}
              onChange={(e) =>
                setCarousel({
                  ...carousel,
                  limit: Number(e.target.value),
                })
              }
            />
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {t("saveChanges")}
          </button>
        </div>
      </form>

      {/* Vista previa - automático */}
      {!isManual && filteredArticles.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-lg font-bold mb-3">{t("previewTitle")}</h2>
          <ul className="space-y-2">
            {filteredArticles.slice(0, carousel.limit || 6).map((article) => (
              <li
                key={article.id}
                className="p-3 border rounded shadow-sm bg-gray-50 dark:bg-gray-800 dark:text-white"
              >
                <strong>{article.title}</strong>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {article.summary || t("noSummary")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vista previa - manual */}
      {isManual && selectedArticles.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-lg font-bold mb-3">
            {t("previewManual") || "Vista previa (orden manual)"}
          </h2>
          <ul className="space-y-2">
            {selectedArticles.map((article, i) => (
              <li
                key={article.id}
                className="p-3 border rounded shadow-sm bg-gray-50 dark:bg-gray-800 dark:text-white"
              >
                <span className="font-bold text-red-600">#{i + 1}</span>{" "}
                <strong>{article.title}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

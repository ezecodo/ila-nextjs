"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

  // Cargar carrusel + selects
  useEffect(() => {
    if (!id) return;

    fetch(`/api/carousels/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setCarousel({
          ...data,
          // normalizamos por si viniera undefined
          titleES: data.titleES || "",
          titleDE: data.titleDE || "",
          beitragstypId: data.beitragstypId ?? "",
          regionId: data.regionId ?? "",
          limit: data.limit ?? 6,
        });
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

  async function handleSubmit(e) {
    e.preventDefault();
    // Enviamos sólo lo que importa (sin name)
    const payload = {
      title: carousel.titleES, // tu API lo requiere
      titleES: carousel.titleES,
      titleDE: carousel.titleDE,
      beitragstypId: carousel.beitragstypId
        ? Number(carousel.beitragstypId)
        : null,
      regionId: carousel.regionId ? Number(carousel.regionId) : null,
      // Si quieres persistir categorías, agrega aquí categoryIds: selectedCategoryIds
      limit: Number(carousel.limit) || 6,
    };

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
                beitragstypId: e.target.value ? Number(e.target.value) : null,
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
            <p className="text-xs text-gray-500 mt-1">{t("categoriesHint")}</p>
          </div>
        </div>

        {/* Límite */}
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
              setCarousel({ ...carousel, limit: Number(e.target.value) })
            }
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {t("saveChanges")}
          </button>
        </div>
      </form>

      {/* Vista previa */}
      {filteredArticles.length > 0 && (
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
    </div>
  );
}

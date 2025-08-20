"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function CreateCarouselPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard.Carousels");

  const [titleES, setTitleES] = useState("");
  const [titleDE, setTitleDE] = useState("");

  const [types, setTypes] = useState([]);
  const [beitragstypId, setBeitragstypId] = useState("");

  const [regions, setRegions] = useState([]);
  const [regionId, setRegionId] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);

  const [limit, setLimit] = useState(6);
  const [filteredArticles, setFilteredArticles] = useState([]);

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
  }, []);

  // Vista previa: filtra por region, tipo y categorías
  useEffect(() => {
    const query = new URLSearchParams();
    if (regionId) query.append("regionId", regionId);
    if (beitragstypId) query.append("beitragstypId", beitragstypId);
    selectedCategoryIds.forEach((id) => query.append("categoryId", String(id)));

    if (regionId || beitragstypId || selectedCategoryIds.length > 0) {
      fetch(`/api/articles/filtered?${query.toString()}`)
        .then((res) => res.json())
        .then((data) => setFilteredArticles(data))
        .catch(() => setFilteredArticles([]));
    } else {
      setFilteredArticles([]);
    }
  }, [regionId, beitragstypId, selectedCategoryIds]);

  function renderRegionOptions(list, depth = 0) {
    return list.flatMap((region) => [
      <option key={region.id} value={region.id}>
        {"— ".repeat(depth) + region.name}
      </option>,
      ...renderRegionOptions(region.children || [], depth + 1),
    ]);
  }

  function onChangeCategories(e) {
    const values = Array.from(e.target.selectedOptions).map((o) =>
      parseInt(o.value, 10)
    );
    setSelectedCategoryIds(values);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/carousels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleES, // requerido por tu API
        titleES,
        titleDE,
        beitragstypId: beitragstypId ? parseInt(beitragstypId, 10) : null,
        regionId: regionId ? parseInt(regionId, 10) : null,
        categoryIds: selectedCategoryIds,
        limit,
      }),
    });

    if (res.ok) {
      router.push("/dashboard/carousels");
    } else {
      const msg = await res.text();
      alert(`${t("createError")}: ${msg}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">{t("title")}</h1>

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
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {t("createButton")}
          </button>
        </div>
      </form>

      {filteredArticles.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-lg font-bold mb-3">{t("previewTitle")}</h2>
          <ul className="space-y-2">
            {filteredArticles.slice(0, limit).map((article) => (
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

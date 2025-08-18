"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function CreateCarouselPage() {
  const router = useRouter();
  const locale = useLocale();

  const [titleES, setTitleES] = useState("");
  const [titleDE, setTitleDE] = useState("");
  const [name, setName] = useState("");

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
    // 👇 añadimos múltiples categoryId en la URL (?categoryId=1&categoryId=5…)
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
        name,
        title: titleES, // requerido por tu API
        titleES,
        titleDE,
        beitragstypId: beitragstypId ? parseInt(beitragstypId, 10) : null,
        regionId: regionId ? parseInt(regionId, 10) : null,
        categoryIds: selectedCategoryIds, // 👈 ahora se envían las categorías
        limit,
      }),
    });

    if (res.ok) {
      router.push("/dashboard/carousels");
    } else {
      const msg = await res.text();
      alert(`Error al crear carrusel: ${msg}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Crear nuevo carrusel</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre interno"
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Título en español"
          className="w-full border p-2 rounded"
          value={titleES}
          onChange={(e) => setTitleES(e.target.value)}
        />

        <input
          type="text"
          placeholder="Título en alemán"
          className="w-full border p-2 rounded"
          value={titleDE}
          onChange={(e) => setTitleDE(e.target.value)}
        />

        {/* Tipo de contenido */}
        <select
          className="w-full border p-2 rounded"
          value={beitragstypId}
          onChange={(e) => setBeitragstypId(e.target.value)}
          required
        >
          <option value="">Seleccionar tipo de contenido</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {locale === "es" && t.nameES ? t.nameES : t.name}
            </option>
          ))}
        </select>

        {/* Región (opcional) */}
        <select
          className="w-full border p-2 rounded"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
        >
          <option value="">Sin región (opcional)</option>
          {renderRegionOptions(regions)}
        </select>

        {/* Categorías (multi-select) */}
        <div>
          <label className="block mb-1 font-medium">
            Categorías (opcional)
          </label>
          <select
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
            Mantén pulsado Ctrl/Cmd para seleccionar varias.
          </p>
        </div>

        <input
          type="number"
          min={1}
          max={20}
          placeholder="Cantidad de artículos"
          className="w-full border p-2 rounded"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Crear carrusel
        </button>
      </form>

      {filteredArticles.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <h2 className="text-lg font-bold mb-3">Vista previa de artículos</h2>
          <ul className="space-y-2">
            {filteredArticles.slice(0, limit).map((article) => (
              <li
                key={article.id}
                className="p-3 border rounded shadow-sm bg-gray-50 dark:bg-gray-800 dark:text-white"
              >
                <strong>{article.title}</strong>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {article.summary || "Sin resumen disponible"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

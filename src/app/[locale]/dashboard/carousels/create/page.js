"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function CreateCarouselPage() {
  const router = useRouter();

  const [titleES, setTitleES] = useState("");
  const [titleDE, setTitleDE] = useState("");
  const [name, setName] = useState("");
  const [beitragstypId, setBeitragstypId] = useState("");
  const [limit, setLimit] = useState(6);
  const [types, setTypes] = useState([]);
  const locale = useLocale();
  const [regions, setRegions] = useState([]);
  const [regionId, setRegionId] = useState("");
  const [filteredArticles, setFilteredArticles] = useState([]);

  useEffect(() => {
    fetch("/api/beitragstypen")
      .then((res) => res.json())
      .then((data) => {
        console.log("TIPOS DE CONTENIDO:", data); // 👈🏼 ¿Se imprime?
        setTypes(data);
      });
    fetch("/api/regions")
      .then((res) => res.json())
      .then((data) => setRegions(data));
  }, []);
  useEffect(() => {
    const query = new URLSearchParams();

    if (regionId) query.append("regionId", regionId);
    if (beitragstypId) query.append("beitragstypId", beitragstypId);

    if (regionId || beitragstypId) {
      fetch(`/api/articles/filtered?${query.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Artículos filtrados:", data);
          setFilteredArticles(data);
        });
    } else {
      setFilteredArticles([]);
    }
  }, [regionId, beitragstypId]);
  function renderRegionOptions(regions, depth = 0) {
    return regions.flatMap((region) => [
      <option key={region.id} value={region.id}>
        {"— ".repeat(depth) + region.name}
      </option>,
      ...renderRegionOptions(region.children || [], depth + 1),
    ]);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/carousels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        title: titleES, // ✅ Aquí estás enviando el campo requerido
        titleES,
        titleDE,
        beitragstypId,
        regionId: regionId || null,
        limit,
      }),
    });

    if (res.ok) {
      router.push("/dashboard/carousels");
    } else {
      alert("Error al crear carrusel");
    }
  };

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
        <select
          className="w-full border p-2 rounded"
          value={beitragstypId}
          onChange={(e) => setBeitragstypId(e.target.value)}
          required
        >
          <option value="">Seleccionar tipo de contenido</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {locale === "es" ? t.nameES : t.name}
            </option>
          ))}
        </select>
        <select
          className="w-full border p-2 rounded"
          value={regionId}
          onChange={(e) => setRegionId(e.target.value)}
        >
          <option value="">Sin región (opcional)</option>
          {renderRegionOptions(regions)}
        </select>
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

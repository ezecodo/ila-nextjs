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

  useEffect(() => {
    fetch("/api/beitragstypen")
      .then((res) => res.json())
      .then((data) => {
        console.log("TIPOS DE CONTENIDO:", data); // 👈🏼 ¿Se imprime?
        setTypes(data);
      });
  }, []);

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
    </div>
  );
}

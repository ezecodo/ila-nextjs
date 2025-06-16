"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CarouselsDashboardPage() {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/carousels")
      .then((res) => res.json())
      .then((data) => {
        const carouselsArray = Array.isArray(data) ? data : data.carousels;
        setCarousels(carouselsArray || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Cargando carruseles...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Carruseles activos</h1>

      <Link
        href="/dashboard/carousels/create"
        className="mb-4 inline-block text-blue-600 hover:underline"
      >
        ➕ Crear nuevo carrusel
      </Link>

      <ul className="space-y-4 mt-4">
        {carousels.map((carousel) => (
          <li
            key={carousel.id}
            className="border rounded p-4 shadow-sm bg-white dark:bg-black dark:text-white"
          >
            <h2 className="text-lg font-semibold">{carousel.name}</h2>
            <p>
              <strong>Título (ES):</strong> {carousel.titleES} <br />
              <strong>Título (DE):</strong> {carousel.titleDE} <br />
              <strong>Tipo de contenido:</strong>{" "}
              {carousel.beitragstyp?.nameES || "—"} <br />
              <strong>Artículos mostrados:</strong> {carousel.limit}
            </p>
            <Link
              href={`/dashboard/carousels/${carousel.id}`}
              className="text-blue-500 hover:underline mt-2 inline-block"
            >
              Editar
            </Link>
            <button
              onClick={async () => {
                if (confirm("¿Estás seguro de eliminar este carrusel?")) {
                  const res = await fetch(`/api/carousels/${carousel.id}`, {
                    method: "DELETE",
                  });
                  if (res.ok) {
                    setCarousels(carousels.filter((c) => c.id !== carousel.id));
                  } else {
                    alert("Error al eliminar carrusel");
                  }
                }
              }}
              className="text-red-600 hover:underline ml-4"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

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

      <div className="grid gap-6 mt-6">
        {carousels.map((carousel, index) => (
          <div
            key={carousel.id}
            className="relative rounded-lg border border-red-200 p-6 shadow-md bg-gradient-to-r from-white via-rose-50 to-red-100"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-red-800">
                  #{index + 1} · {carousel.titleES}
                </h2>
                <p className="text-sm text-gray-700">
                  Tipo:{" "}
                  <span className="font-semibold">
                    {carousel.beitragstyp?.nameES || "—"}
                  </span>{" "}
                  ·{" "}
                  <span className="text-red-600 font-bold">
                    {carousel.limit}
                  </span>{" "}
                  artículos
                </p>
              </div>

              <div className="flex gap-3 text-sm">
                <Link
                  href={`/dashboard/carousels/${carousel.id}`}
                  className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded transition"
                >
                  ✏️ Editar
                </Link>
                <button
                  onClick={async () => {
                    if (confirm("¿Eliminar este carrusel?")) {
                      const res = await fetch(`/api/carousels/${carousel.id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        setCarousels(
                          carousels.filter((c) => c.id !== carousel.id)
                        );
                      } else {
                        alert("Error al eliminar");
                      }
                    }
                  }}
                  className="px-3 py-1 bg-rose-200 text-red-900 hover:bg-rose-300 rounded transition"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-2 overflow-hidden">
              {Array.from({ length: carousel.limit }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-16 bg-gradient-to-tr from-red-500 to-rose-400 rounded-md shadow-inner"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

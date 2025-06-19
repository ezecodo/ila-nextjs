"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function CarouselsDashboardPage() {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("dashboard.Carousels");
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/carousels")
      .then((res) => res.json())
      .then((data) => {
        const carouselsArray = Array.isArray(data) ? data : data.carousels;
        const sorted = [...(carouselsArray || [])].sort(
          (a, b) => a.position - b.position
        );
        setCarousels(sorted);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>{t("loadingCarousels")}</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("activeCarousels")}</h1>

      <Link
        href="/dashboard/carousels/create"
        className="mb-4 inline-block text-blue-600 hover:underline"
      >
        ➕ {t("createNew")}
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
                  #{index + 1} ·{" "}
                  {locale === "es" ? carousel.titleES : carousel.titleDE}
                </h2>
                <p className="text-sm text-gray-700">
                  {t("type")}:{" "}
                  <span className="font-semibold">
                    {locale === "de"
                      ? carousel.beitragstyp?.name
                      : carousel.beitragstyp?.nameES}
                  </span>{" "}
                  ·{" "}
                  <span className="text-red-600 font-bold">
                    {carousel.limit}
                  </span>{" "}
                  {t("articles")}
                </p>
                <span className="text-sm italic text-gray-500">
                  🌍 {carousel.region?.name}
                </span>
              </div>

              <div className="flex gap-3 text-sm items-center">
                {/* 🔼 Subir */}
                <button
                  disabled={index === 0}
                  onClick={async () => {
                    const updated = [...carousels];
                    [updated[index - 1], updated[index]] = [
                      updated[index],
                      updated[index - 1],
                    ];

                    await Promise.all([
                      fetch(`/api/carousels/${updated[index].id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ position: index }),
                      }),
                      fetch(`/api/carousels/${updated[index - 1].id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ position: index - 1 }),
                      }),
                    ]);

                    setCarousels(updated);
                  }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  🔼
                </button>

                {/* 🔽 Bajar */}
                <button
                  disabled={index === carousels.length - 1}
                  onClick={async () => {
                    const updated = [...carousels];
                    [updated[index], updated[index + 1]] = [
                      updated[index + 1],
                      updated[index],
                    ];

                    await Promise.all([
                      fetch(`/api/carousels/${updated[index].id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ position: index }),
                      }),
                      fetch(`/api/carousels/${updated[index + 1].id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ position: index + 1 }),
                      }),
                    ]);

                    setCarousels(updated);
                  }}
                  className="text-gray-500 hover:text-gray-800"
                >
                  🔽
                </button>

                {/* ✏️ Editar */}
                <Link
                  href={`/dashboard/carousels/${carousel.id}`}
                  className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded transition"
                >
                  ✏️ {t("edit")}
                </Link>

                {/* 🗑️ Eliminar */}
                <button
                  onClick={async () => {
                    if (confirm(t("confirmDelete"))) {
                      const res = await fetch(`/api/carousels/${carousel.id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        setCarousels(
                          carousels.filter((c) => c.id !== carousel.id)
                        );
                      } else {
                        alert(t("errorDeleting"));
                      }
                    }
                  }}
                  className="px-3 py-1 bg-rose-200 text-red-900 hover:bg-rose-300 rounded transition"
                >
                  🗑️ {t("delete")}
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

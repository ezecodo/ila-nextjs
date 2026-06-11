"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import ArticleCarousel from "../../components/Articles/ArticleCarousel/ArticleCarousel";
import ArticleCarouselVer from "../../components/Articles/ArticleCarouselVer/ArticleCarouselVer";

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

  // ✅ Título ESTRICTO por idioma (sin fallback)

  // (estos sí pueden tener fallback, si quieres mantenerlo)
  const getTypeName = (c) =>
    locale === "de" ? c.beitragstyp?.name || "" : c.beitragstyp?.nameES || "";

  const getRegionName = (c) =>
    String(locale).toLowerCase().startsWith("de")
      ? c.region?.name
      : c.region?.nameES;

  // Mismo título que usa la landing (CarouselFromDb)
  const carouselTitle = (c) =>
    String(locale).toLowerCase().startsWith("de")
      ? c.titleDE || c.titleES
      : c.titleES || c.titleDE;

  if (loading) return <p>{t("loadingCarousels")}</p>;

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-bold mb-4">{t("activeCarousels")}</h1>

      <Link
        href="/dashboard/carousels/create"
        className="mb-4 inline-block text-blue-600 hover:underline"
      >
        ➕ {t("createNew")}
      </Link>

      <div className="grid gap-6 mt-6">
        {carousels.map((carousel, index) => {
          return (
            <div
              key={carousel.id}
              className="rounded-lg border border-gray-200 shadow-md bg-white overflow-hidden"
            >
              {/* Barra fina de controles */}
              <div className="flex flex-wrap justify-between items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <h2 className="text-base font-bold text-red-800 truncate">
                    #{index + 1} ·{" "}
                    {String(locale).toLowerCase().startsWith("de")
                      ? carousel.titleDE || carousel.titleES
                      : carousel.titleES || carousel.titleDE}
                  </h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      carousel.isManual
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {carousel.isManual ? t("badgeManual") : t("badgeAutomatic")}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getTypeName(carousel) ? `${getTypeName(carousel)} · ` : ""}
                    {getRegionName(carousel) ? `🌍 ${getRegionName(carousel)} · ` : ""}
                    {carousel.limit} {t("articles")}
                  </span>
                </div>

                <div className="flex gap-2 text-sm items-center shrink-0">
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
                        const res = await fetch(
                          `/api/carousels/${carousel.id}`,
                          {
                            method: "DELETE",
                          }
                        );
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

              {/* Preview real — igual que en la landing */}
              <div className="p-4">
                {carousel.carouselType === "vertical" ? (
                  <ArticleCarouselVer
                    beitragstypId={carousel.beitragstypId}
                    region={carousel.regionId || null}
                    title={carouselTitle(carousel)}
                    limit={carousel.limit}
                    slidesToShow={5}
                    isManual={carousel.isManual}
                    manualArticles={
                      carousel.isManual && carousel.articles
                        ? carousel.articles.map((ca) => ca.article)
                        : null
                    }
                  />
                ) : (
                  <ArticleCarousel
                    beitragstypId={carousel.beitragstypId}
                    region={carousel.regionId || null}
                    title={carouselTitle(carousel)}
                    limit={carousel.limit}
                    slidesToShow={4}
                    isManual={carousel.isManual}
                    manualArticles={
                      carousel.isManual && carousel.articles
                        ? carousel.articles.map((ca) => ca.article)
                        : null
                    }
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

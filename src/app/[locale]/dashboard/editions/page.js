"use client";

import { useState, useEffect } from "react";
import GenericAdminListDossiers from "../components/GenericAdminListDossiers/GenericAdminLIstDossiers";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";

export default function EditionListPage() {
  const t = useTranslations("dossiers");

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");

  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await fetch("/api/editions");
        const data = await res.json();
        const uniqueYears = Array.from(
          new Set(
            (Array.isArray(data) ? data : [])
              .map((ed) =>
                ed?.datePublished
                  ? new Date(ed.datePublished).getFullYear()
                  : null
              )
              .filter(Boolean)
          )
        ).sort((a, b) => b - a);
        setYears(uniqueYears);
      } catch (e) {
        console.error("❌ Error cargando años:", e);
        setYears([]);
      }
    }
    fetchYears();
  }, []);

  const columns = [
    { key: "number", label: "N°" }, // ✅ Cambiado
    {
      key: "title",
      label: t("title"),
      format: (value, item) => (
        <Link
          href={`/editions/${item.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
        >
          {value}
        </Link>
      ),
    },

    {
      key: "datePublished",
      label: t("date"),
      format: (value) =>
        value
          ? new Date(value).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "long",
            })
          : "-",
    },
    {
      key: "isCurrent",
      label: t("isCurrent"),
      format: (value) => (value ? "✅" : "❌"),
    },
    {
      key: "isAvailableToOrder",
      label: "🛒",
      format: (value) =>
        value ? (
          <FaShoppingCart
            className="text-green-600 text-lg mx-auto"
            title="Bestellbar?"
          />
        ) : (
          <FaShoppingCart className="text-red-600 text-lg mx-auto" />
        ),
    },
    {
      key: "isTranslatedES",
      label: "🇪🇸 ES",
      format: (value, item) => {
        if (!item.isTranslatedES) {
          return <span className="text-gray-400">❌</span>;
        }
        if (item.needsReviewES) {
          return (
            <span className="text-yellow-600" title="Needs review">
              ⚠️
            </span>
          );
        }
        return <span className="text-green-600">✅</span>;
      },
    },
    {
      key: "translate",
      label: "Traducción",
      format: (value, item) => {
        // Estados posibles
        const approved = item.translationStatus === "approved";
        const needsReview = item.needsReviewES;
        const isTranslated = item.isTranslatedES;

        let buttonText = "🌐 Traducir";
        let buttonColor = "bg-green-600 hover:bg-green-700";

        if (approved) {
          buttonText = "✏️ Editar traducción aprobada";
          buttonColor = "bg-blue-600 hover:bg-blue-700";
        } else if (isTranslated || needsReview) {
          buttonText = "✏️ Editar traducción";
          buttonColor = "bg-yellow-500 hover:bg-yellow-600";
        }

        return (
          <Link
            href={`/dashboard/editions/translate/${item.id}`}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs rounded transition-colors font-medium ${buttonColor}`}
          >
            {buttonText}
          </Link>
        );
      },
    },
  ];

  return (
    <div className="p-6 w-full max-w-full">
      <h1 className="text-2xl font-bold mb-2 text-purple-700">
        {t("listTitle")}
      </h1>

      <Link
        href="/dashboard/editions/new"
        className="mb-6 inline-block text-blue-600 hover:underline"
      >
        ➕ {t("createNew")}
      </Link>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-semibold text-gray-700">
          {t("filterByYear") || "Filtrar por Año:"}
        </label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-2 border rounded text-sm"
        >
          <option value="">{t("allYears") || "-- Todos --"}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* 👇 Añade una key que cambie cuando selectedYear cambia */}
      <GenericAdminListDossiers
        key={selectedYear} // 🔥 Esto fuerza a recrear el componente
        endpoint="/api/editions"
        columns={columns}
        editUrlPrefix="/dashboard/editions/edit"
        deleteUrlPrefix="/api/editions"
        itemName={t("dossierItemName")}
        extraQuery={{ year: selectedYear || undefined }}
        defaultSortField={selectedYear ? "datePublished" : "number"} // 👈 Cambié "id" por "number"
        defaultSortOrder="desc"
      />
    </div>
  );
}

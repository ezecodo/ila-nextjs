"use client";

import { useState, useEffect } from "react";
import GenericAdminListDossiers from "../components/GenericAdminListDossiers/GenericAdminLIstDossiers";
import { useTranslations } from "next-intl";
import Link from "next/link";

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
    { key: "id", label: "ID" },
    { key: "number", label: t("number") },
    { key: "title", label: t("title") },
    { key: "subtitle", label: t("subtitle") },
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
      label: t("isAvailable"),
      format: (value) => (value ? "🟢" : "🔴"),
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
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

"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import GenericAdminListAktuelles from "../components/GenericAdminListAktuelles/GenericAdminListAktuelles";

export default function AktuellesDashboardPage() {
  const t = useTranslations("dashboard.Aktuelles");
  const locale = useLocale();
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold mb-2 text-purple-700">
        {t("listTitle")}
      </h1>

      <Link
        href="/dashboard/aktuelles/create"
        className="mb-6 inline-block text-blue-600 hover:underline"
      >
        ➕ {t("createNew")}
      </Link>

      {/* Lista genérica */}
      <GenericAdminListAktuelles
        title={t("listTitle")}
        endpoint="/api/aktuelles"
        editUrlPrefix="/dashboard/aktuelles/edit/"
        deleteUrlPrefix="/api/aktuelles"
        itemName="Aktuelles"
        columns={[
          { key: "id", label: "ID" },
          {
            key: "title", // 👈 clave única fija
            label: locale === "es" ? t("titleES") : t("titleDE"),
            format: (_val, item) =>
              locale === "es" ? item.titleES || "—" : item.title || "—",
          },
          {
            key: "date",
            label: t("date"),
            format: (val) =>
              val ? new Date(val).toLocaleDateString("de-DE") : "—",
          },
          {
            key: "createdBy",
            label: t("author"),
            format: (val) => val?.name || "—",
          },
          {
            key: "titleES",
            label: t("titleES"),
            format: (val) => (val ? "✅" : "❌"),
          },
        ]}
      />
    </div>
  );
}

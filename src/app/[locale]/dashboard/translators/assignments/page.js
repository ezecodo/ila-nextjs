"use client";

import { useSession } from "next-auth/react";
import ArticlesList from "../../components/ArticlesList/ArticlesList";
import GenericAdminListDossiers from "../../components/GenericAdminListDossiers/GenericAdminLIstDossiers";
import Link from "next/link";
import { useState } from "react";

export default function TranslatorAssignments() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("articles");

  const userId = session?.user?.id;

  if (!userId) {
    return (
      <p className="text-center text-gray-500 p-6">
        Debes iniciar sesión para ver tus asignaciones.
      </p>
    );
  }

  // 🔹 Columnas para dossiers
  const dossierColumns = [
    { key: "number", label: "N°" },
    {
      key: "title",
      label: "Título",
      format: (value, item) => (
        <Link
          href={`/editions/${item.id}`}
          target="_blank"
          className="text-blue-600 hover:underline font-medium"
        >
          {value}
        </Link>
      ),
    },
    {
      key: "datePublished",
      label: "Fecha",
      format: (value) =>
        value
          ? new Date(value).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "long",
            })
          : "-",
    },
    {
      key: "translationStatus",
      label: "Estado",
      format: (value) => {
        const map = {
          assigned: "🟢 Asignado",
          in_progress: "🟡 En curso",
          done: "✅ Terminado",
          not_assigned: "⚪ Sin asignar",
        };
        return map[value] || "—";
      },
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        📘 Mis Asignaciones
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "articles"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📰 Artículos
        </button>
        <button
          onClick={() => setActiveTab("dossiers")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "dossiers"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📚 Dossiers
        </button>
      </div>

      {/* Contenido */}
      {activeTab === "articles" ? (
        <ArticlesList mode="translator" />
      ) : (
        <GenericAdminListDossiers
          endpoint={`/api/editions?translatorId=${userId}`}
          columns={dossierColumns}
          editUrlPrefix="/dashboard/editions/translate"
          deleteUrlPrefix={null}
          itemName="dossier"
          defaultSortField="number"
          defaultSortOrder="desc"
          mode="translator"
        />
      )}
    </div>
  );
}

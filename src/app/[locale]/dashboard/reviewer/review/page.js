"use client";

import { useState } from "react";
import ArticlesList from "../../components/ArticlesList/ArticlesList";
import GenericAdminListDossiers from "../../components/GenericAdminListDossiers/GenericAdminLIstDossiers";

export default function ReviewDashboard() {
  const [activeTab, setActiveTab] = useState("articles");

  // 🔹 Columnas para dossiers
  const dossierColumns = [
    { key: "number", label: "N°" },
    {
      key: "title",
      label: "Título",
      format: (value) => (
        <span className="font-medium text-blue-700">{value}</span>
      ),
    },
    {
      key: "translator",
      label: "Traductor/a",
      format: (value, item) =>
        item.translator?.name || item.translator?.email || "—",
    },
    {
      key: "translationStatus",
      label: "Estado",
      format: (value) => {
        const map = {
          submitted: "📤 Enviado para revisión",
          needs_changes: "🟡 Cambios solicitados",
          approved: "✅ Aprobado",
          in_progress: "✍️ En curso",
          assigned: "🟢 Asignado",
        };
        return map[value] || value || "—";
      },
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-purple-700 mb-4">
        📝 Revisiones pendientes
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("articles")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "articles"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📰 Artículos
        </button>
        <button
          onClick={() => setActiveTab("dossiers")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "dossiers"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📚 Dossiers
        </button>
      </div>

      {/* Contenido */}
      {activeTab === "articles" ? (
        <ArticlesList mode="reviewer" />
      ) : (
        <GenericAdminListDossiers
          endpoint="/api/editions?status=assigned,in_progress,submitted"
          columns={dossierColumns}
          editUrlPrefix="/dashboard/editions/translate"
          deleteUrlPrefix={null}
          itemName="dossier"
          defaultSortField="number"
          defaultSortOrder="desc"
          mode="reviewer"
        />
      )}
    </div>
  );
}

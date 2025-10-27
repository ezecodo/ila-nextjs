"use client";
import { useState } from "react";
import ArticlesList from "../../components/ArticlesList/ArticlesList";
import GenericAdminListDossiers from "../../components/GenericAdminListDossiers/GenericAdminLIstDossiers";
import AssignTranslatorCellEdition from "../../components/GenericAdminListDossiers/AssignTranslatorCellEdition";
import Link from "next/link";

export default function AssignPage() {
  const [activeTab, setActiveTab] = useState("articles");

  // 📚 Configuración de columnas para dossiers
  const dossierColumns = [
    { key: "number", label: "N°" },
    {
      key: "title",
      label: "Título",
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
      key: "translator",
      label: "Asignar Traductor",
      format: (value, item, updateRow) => (
        <AssignTranslatorCellEdition
          edition={item}
          onAssigned={(updatedEdition) => {
            if (updateRow) updateRow(updatedEdition);
          }}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        📝 Asignar Traducciones
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
          📄 Artículos
        </button>
        <button
          onClick={() => setActiveTab("editions")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "editions"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📚 Dossiers
        </button>
      </div>

      {/* Contenido */}
      {activeTab === "articles" ? (
        <ArticlesList mode="assign" />
      ) : (
        <GenericAdminListDossiers
          endpoint="/api/editions"
          columns={dossierColumns}
          editUrlPrefix="/dashboard/editions/edit"
          deleteUrlPrefix={null}
          itemName="dossier"
          extraQuery={{ unassigned: "true" }}
          defaultSortField="number"
          defaultSortOrder="desc"
        />
      )}
    </div>
  );
}

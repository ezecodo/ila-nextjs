"use client";

import ArticlesList from "../../components/ArticlesList/ArticlesList";

export default function TranslatorAssignments() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-red-600 mb-4">
        📘 Mis Asignaciones
      </h1>
      <ArticlesList mode="translator" />
    </div>
  );
}

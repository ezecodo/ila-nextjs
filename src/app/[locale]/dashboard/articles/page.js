"use client";

import ArticlesList from "../components/ArticlesList/ArticlesList";
import DashboardSectionHeader from "../components/DashboardSectionHeader/DashboardSectionHeader";
import { useTranslations } from "next-intl";

export default function ArticlesPage() {
  const t = useTranslations("dashboard.menu");
  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* ✅ Header unificado */}
      <DashboardSectionHeader
        title={t("listTitle")} // 👈 Ej: "Lista de Artículos"
        createUrl="/dashboard/articles/new" // 👈 el botón "➕ Crear nuevo artículo"
        createLabel={t("newArticle")}
        color="red"
      />

      {/* ✅ Lista de artículos */}
      <ArticlesList />
    </div>
  );
}

"use client";

import ArticlesList from "../components/ArticlesList/ArticlesList";
import DashboardSectionHeader from "../components/DashboardSectionHeader/DashboardSectionHeader";
import { useTranslations } from "next-intl";

export default function ArticlesPage() {
  const t = useTranslations("dashboard.menu");
  return (
    <div className="w-full py-4">
      {/* ✅ Header unificado */}
      <DashboardSectionHeader
        title={t("listTitle")}
        createUrl="/dashboard/articles/new"
        createLabel={t("newArticle")}
        color="red"
      />
      <a
        href="/dashboard/articles/new-v2"
        className="inline-block text-xs text-orange-600 hover:underline mb-4 ml-1"
      >
        🧪 Nuevo formulario v2 (Interview-Editor) — en pruebas
      </a>

      {/* ✅ Lista de artículos */}
      <ArticlesList />
    </div>
  );
}

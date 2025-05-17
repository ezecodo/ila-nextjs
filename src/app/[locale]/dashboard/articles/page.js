"use client";

import ArticlesList from "../components/ArticlesList/ArticlesList";

export default function ArticlesPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">📄 Lista de artículos</h1>
      <ArticlesList />
    </div>
  );
}

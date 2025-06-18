"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import ArticleCard from "../../components/Articles/ArticleCard";
import { useTranslations } from "next-intl";

export default function AuthorPage() {
  const t = useTranslations("author");

  const { id } = useParams();
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 🔥 Nuevo estado

  useEffect(() => {
    if (!id) return;

    async function fetchAuthor() {
      try {
        const response = await fetch(`/api/authors/${id}`);
        if (!response.ok) throw new Error(t("loadingAuthorError"));

        const data = await response.json();
        setAuthor(data.author);
        setArticles(data.articles);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false); // 🔥 Importante: cuando termina la carga, actualizamos
      }
    }

    fetchAuthor();
  }, [id, t]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!author) return <p>{t("loadingAuthor")}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Nombre del autor */}
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        {t("by", { name: author.name })}
      </h1>

      {/* Mostrar "Cargando..." mientras se trae la data */}
      {isLoading ? (
        <p className="text-gray-500">{t("loadingArticles")}</p>
      ) : articles.length > 0 ? (
        <div className="grid gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">{t("noArticles")}</p>
      )}
    </div>
  );
}

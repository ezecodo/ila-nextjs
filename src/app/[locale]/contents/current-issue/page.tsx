// app/[locale]/contents/current-issue/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import CartButton from "../../components/CartButton/CartButton";
import { useTranslations } from "next-intl";

// ─── Tipos ─────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  legacyPath: string;
}

interface Edition {
  id: string;
  number: number;
  title: string;
  coverImage: string;
  datePublished: string;
  summary: string;
  tableOfContents: string;
  isAvailableToOrder: boolean;
  regions: { id: string; name: string }[];
  topics: { id: string; name: string }[];
}

// ─── Componente principal ──────────────────────────────
export default function CurrentIssuePage() {
  const [edition, setEdition] = useState<Edition | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("dossiers");

  // 👉 siempre cargamos la edición 488
  useEffect(() => {
    async function fetchEditionAndArticles() {
      try {
        const res = await fetch(`/api/editions/488`);
        if (!res.ok) throw new Error("Error al cargar la edición");
        const data: Edition = await res.json();
        setEdition(data);

        const articlesRes = await fetch(`/api/articles/edition/${data.number}`);
        const articlesData: Article[] = await articlesRes.json();
        setArticles(articlesData);
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchEditionAndArticles();
  }, []);

  // ─── Render índice de contenidos ─────────────────────
  function renderTableOfContents() {
    if (!edition?.tableOfContents) return null;

    let normalized = edition.tableOfContents;
    if (!normalized.includes("\n")) {
      normalized = normalized
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\u00A0/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/(\d{1,3})\s+/g, "\n$1 ");
    }

    return normalized.split("\n").map((line: string, index: number) => {
      const matchedArticle = articles.find((article) =>
        line.toLowerCase().includes(article.title.toLowerCase())
      );

      const isLinked = Boolean(matchedArticle);

      return (
        <div
          key={index}
          className={`flex justify-between items-center px-4 py-2 border-b dark:border-gray-700 ${
            isLinked ? "hover:bg-gray-50 dark:hover:bg-gray-800 transition" : ""
          }`}
        >
          <div
            className={`text-sm md:text-base ${
              isLinked
                ? "text-blue-700 dark:text-blue-400 font-medium"
                : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {isLinked ? (
              <Link
                href={matchedArticle!.legacyPath}
                className="flex items-center gap-2 hover:underline"
              >
                <span>{line}</span>
                <span>🔗</span>
              </Link>
            ) : (
              line
            )}
          </div>
        </div>
      );
    });
  }

  // ─── Render principal ────────────────────────────────
  if (error) return <p className="text-red-500">{error}</p>;
  if (!edition) return <p>Cargando edición...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-3xl md:text-4xl mb-4 text-center leading-snug flex flex-wrap justify-center items-baseline gap-2">
          <span
            style={{ fontFamily: "Futura" }}
            className="font-bold text-gray-800 dark:text-gray-200"
          >
            ila {edition.number}
          </span>
          <span className="font-serif font-bold text-red-800 dark:text-red-400">
            {edition.title}
          </span>
        </h1>

        <div className="relative max-w-[550px] mb-4">
          <Image
            src={edition.coverImage}
            alt={`Portada de ${edition.title}`}
            width={550}
            height={700}
            style={{ objectFit: "contain" }}
          />

          <div className="badgesContainer">
            {edition.regions.length > 0 ? (
              edition.regions.map((region) => (
                <span key={region.id} className="regionBadge">
                  {region.name}
                </span>
              ))
            ) : (
              <span className="regionBadge">Sin regiones asociadas</span>
            )}
          </div>

          <div className="badgesContainer">
            {edition.topics.length > 0 ? (
              edition.topics.map((topic) => (
                <span key={topic.id} className="topicBadge">
                  {topic.name}
                </span>
              ))
            ) : (
              <span className="topicBadge">Sin temas asociados</span>
            )}
          </div>

          {edition.isAvailableToOrder && (
            <CartButton
              onClick={() => console.log("Añadido al carrito")}
              className="ml-2"
            />
          )}
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Publicado el{" "}
        {new Date(edition.datePublished).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="text-gray-700 dark:text-gray-300 mb-6">
        {edition.summary
          ? edition.summary.split("\n").map((line, index) => (
              <p key={index} className="mb-4">
                {line}
              </p>
            ))
          : "Sin resumen"}
      </div>

      {/* 📚 Tabla de contenidos */}
      {edition.tableOfContents && (
        <div className="my-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-1">
            {t("tableOfContents")}
          </h2>
          <div className="rounded-md shadow-sm border border-gray-200 dark:border-gray-700 divide-y dark:divide-gray-700">
            {renderTableOfContents()}
          </div>
        </div>
      )}

      <Link
        href="/editions"
        className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800 transition"
      >
        Volver a las ediciones
      </Link>
    </div>
  );
}

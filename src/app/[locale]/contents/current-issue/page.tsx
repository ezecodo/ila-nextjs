"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import CartButton from "../../components/CartButton/CartButton";
import { useTranslations, useLocale } from "next-intl";

export default function CurrentIssuePage() {
  interface Edition {
    id: number;
    number: number;
    title: string;
    subtitle?: string | null;
    coverImage: string;
    datePublished: string;
    summary?: string | null;
    tableOfContents?: string | null;
    isAvailableToOrder: boolean;
    regions: { id: number; name: string }[];
    topics: { id: number; name: string }[];
  }

  interface Article {
    id: number;
    title: string;
    legacyPath: string;
  }

  const [edition, setEdition] = useState<Edition | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("dossiers");
  const locale = useLocale();

  useEffect(() => {
    async function fetchEditionAndArticles() {
      try {
        const res = await fetch(`/api/editions?current=true`);
        if (!res.ok) throw new Error("Error al cargar la edición");
        const data = await res.json();

        // Puede venir array → tomamos el primero
        const currentEdition = Array.isArray(data) ? data[0] : data;
        setEdition(currentEdition);

        const articlesRes = await fetch(
          `/api/articles/edition/${currentEdition.number}`
        );
        const articlesData = await articlesRes.json();
        setArticles(articlesData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Error desconocido");
        }
      }
    }

    fetchEditionAndArticles();
  }, []);

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

    return normalized.split("\n").map((line, index) => {
      const matchedArticle = articles.find((article) =>
        line.toLowerCase().includes(article.title.toLowerCase())
      );

      const isLinked = Boolean(matchedArticle);
      const isAktuelles = line.trim().toLowerCase() === "aktuelles";

      return (
        <div
          key={index}
          className={`flex justify-between items-center px-4 py-1 border-b dark:border-gray-700 ${
            isLinked ? "hover:bg-gray-50 dark:hover:bg-gray-800 transition" : ""
          }`}
        >
          <div
            className={`text-sm md:text-base ${
              isLinked
                ? "text-blue-700 dark:text-blue-400 font-medium"
                : isAktuelles
                  ? "font-bold text-gray-900 dark:text-gray-100"
                  : "text-gray-800 dark:text-gray-200"
            }`}
          >
            {isLinked ? (
              <Link href={matchedArticle?.legacyPath || "#"}>
                <div className="flex items-center gap-2 hover:underline">
                  <span>{line}</span>
                  <span>🔗</span>
                </div>
              </Link>
            ) : (
              line
            )}
          </div>
        </div>
      );
    });
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!edition) return <p>Cargando edición...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Contenedor principal con float */}
      <div className="mb-8">
        {/* Imagen flotante a la izquierda */}
        <div className="float-left mr-6 mb-4 w-full md:w-1/3">
          <Image
            src={edition.coverImage}
            alt={`Portada de ${edition.title}`}
            width={400}
            height={550}
            className="rounded shadow-md w-full max-w-xs"
          />

          <div className="badgesContainer mt-2">
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

          <div className="badgesContainer mt-2">
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
              className="mt-2"
            />
          )}
        </div>

        {/* Título y fecha */}
        <div className="overflow-hidden">
          {" "}
          {/* Clearfix para contener el float */}
          <h1 className="text-3xl md:text-4xl mb-4 leading-snug">
            <span
              className="font-bold text-gray-800 dark:text-gray-200"
              style={{ fontFamily: "Futura" }}
            >
              ila {edition.number}
            </span>{" "}
            <span className="font-serif font-bold text-red-800 dark:text-red-400">
              {edition.title}
            </span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {locale === "es" ? "Publicado el " : "Veröffentlicht am "}
            {new Date(edition.datePublished).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Texto del summary que fluye alrededor de la imagen */}
        <div className="text-gray-700 dark:text-gray-300">
          {edition.summary
            ? edition.summary.split("\n").map((line, i) => (
                <p key={i} className="mb-4">
                  {line}
                </p>
              ))
            : "Sin resumen"}
        </div>

        {/* Clearfix para asegurar que los elementos siguientes no se monten */}
        <div className="clear-both"></div>
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
    </div>
  );
}

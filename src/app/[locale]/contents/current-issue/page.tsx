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

  interface ParsedArticle {
    id: number;
    pageNumber: string | null;
    title: string;
    subtitle: string | null;
    author: string | null;
    isLinked: boolean;
    matchedArticle: Article | null;
    isSection: boolean;
  }

  const [edition, setEdition] = useState<Edition | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
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

  function parseTableOfContents(): ParsedArticle[] {
    if (!edition?.tableOfContents) return [];

    let normalized = edition.tableOfContents;
    if (!normalized.includes("\n")) {
      normalized = normalized
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\u00A0/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/(\d{1,3})\s+/g, "\n$1 ");
    }

    const lines = normalized.split("\n").filter((line) => line.trim());
    const parsedArticles: ParsedArticle[] = [];
    let currentArticle: ParsedArticle | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const pageNumber = line.match(/^\d+/)?.[0] || null;

      // Si la línea empieza con número, es un nuevo artículo
      if (pageNumber && /^\d+\s/.test(line)) {
        // Guardar el artículo anterior si existe
        if (currentArticle) {
          parsedArticles.push(currentArticle);
        }

        // Crear nuevo artículo
        const titleWithoutPage = line.replace(/^\d+\s*/, "");
        const matchedArticle = articles.find((article) =>
          titleWithoutPage.toLowerCase().includes(article.title.toLowerCase())
        );

        currentArticle = {
          id: parsedArticles.length,
          pageNumber,
          title: titleWithoutPage,
          subtitle: null,
          author: null,
          isLinked: Boolean(matchedArticle),
          matchedArticle: matchedArticle || null,
          isSection: line.trim().toLowerCase() === "aktuelles",
        };
      }
      // Si no empieza con número, puede ser subtítulo o autor
      else if (currentArticle) {
        if (line.toLowerCase().startsWith("von ")) {
          currentArticle.author = line;
        } else if (!currentArticle.subtitle) {
          currentArticle.subtitle = line;
        }
      }
      // Líneas especiales como "Aktuelles"
      else {
        parsedArticles.push({
          id: parsedArticles.length,
          pageNumber: null,
          title: line,
          subtitle: null,
          author: null,
          isLinked: false,
          matchedArticle: null,
          isSection: line.toLowerCase() === "aktuelles",
        });
      }
    }

    // No olvidar el último artículo
    if (currentArticle) {
      parsedArticles.push(currentArticle);
    }

    return parsedArticles;
  }

  function renderTableOfContents() {
    const contents = parseTableOfContents();
    const displayContents = isExpanded ? contents : contents.slice(0, 6);

    return (
      <div className="space-y-3">
        {displayContents.map((article) => (
          <div
            key={article.id}
            className={`group p-5 rounded-xl border-2 transition-all duration-200 ${
              article.isLinked
                ? "border-blue-200 dark:border-blue-800 bg-gradient-to-r from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-800/10 hover:from-red-100 hover:to-red-50 dark:hover:from-red-900/30 dark:hover:to-red-800/20shadow-sm hover:shadow-md"
                : article.isSection
                  ? "border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-800/10"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {article.isLinked ? (
              <Link
                href={article.matchedArticle?.legacyPath || "#"}
                className="block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Page number and badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {article.pageNumber && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white">
                          {t("page")} {article.pageNumber}
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        {t("article")}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 group-hover:text-red-900 dark:group-hover:text-blue-100 leading-tight mb-2">
                      {article.title}
                    </h3>

                    {/* Subtitle */}
                    {article.subtitle && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2 leading-relaxed">
                        {article.subtitle}
                      </p>
                    )}

                    {/* Author */}
                    {article.author && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {article.author}
                      </p>
                    )}
                  </div>

                  {/* Arrow icon */}
                  <div className="ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1">
                    <svg
                      className="w-6 h-6text-red-600 dark:text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Section indicators */}
                  <div className="flex items-center gap-2 mb-3">
                    {article.pageNumber && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-600 text-white">
                        Pág. {article.pageNumber}
                      </span>
                    )}
                    {article.isSection && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white">
                        {t("section")}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-lg leading-tight mb-2 ${
                      article.isSection
                        ? "font-bold text-red-800 dark:text-red-200"
                        : "font-semibold text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {article.title}
                  </h3>

                  {/* Subtitle and Author for non-linked items */}
                  {article.subtitle && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2 leading-relaxed">
                      {article.subtitle}
                    </p>
                  )}

                  {article.author && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {article.author}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {contents.length > 6 && (
          <div className="text-center pt-6">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700over:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isExpanded ? (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  {t("showLess")}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  {t("showMore", { count: contents.length - 6 })}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
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
              <span className="topicBadge">{t("noTopics")}</span>
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
            {t("publishedOn")}{" "}
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
            : t("noSummary")}
        </div>

        {/* Clearfix para asegurar que los elementos siguientes no se monten */}
        <div className="clear-both"></div>
      </div>

      {/* 📚 Tabla de contenidos mejorada */}
      {edition.tableOfContents && (
        <div className="my-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t("tableOfContents")}
            </h2>
          </div>

          {renderTableOfContents()}
        </div>
      )}
    </div>
  );
}

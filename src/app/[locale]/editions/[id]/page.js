"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import Image from "next/image";
import CartButton from "../../components/CartButton/CartButton";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import { useTranslations, useLocale } from "next-intl";

export default function EditionDetails() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [edition, setEdition] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const t = useTranslations("dossiers");
  const locale = useLocale();
  const articleRefs = useRef({});

  // Restaurar scroll position cuando volvemos de un artículo
  useEffect(() => {
    // Primero intentar desde searchParams (si viene de URL)
    const scrollToArticle = searchParams.get("scrollTo");

    // Si no hay en URL, intentar desde sessionStorage
    const savedArticle = sessionStorage.getItem("dossierScrollArticle");
    const savedPath = sessionStorage.getItem("dossierScrollPath");

    const articleToScroll =
      scrollToArticle ||
      (savedPath === window.location.pathname ? savedArticle : null);

    if (articleToScroll) {
      // Extraer el número del artículo (article-7 -> 7)
      const articleIndex = parseInt(articleToScroll.split("-")[1]);

      // Si el artículo está más allá de los primeros 6, expandir la lista primero
      if (articleIndex >= 6) {
        setIsExpanded(true);
      }

      // Esperar a que se renderice (más tiempo si expandimos)
      setTimeout(
        () => {
          if (articleRefs.current[articleToScroll]) {
            articleRefs.current[articleToScroll]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            // Limpiar sessionStorage después de usar
            sessionStorage.removeItem("dossierScrollArticle");
            sessionStorage.removeItem("dossierScrollPath");
          }
        },
        articleIndex >= 6 ? 300 : 100
      );
    }
  }, [searchParams, articles]);

  useEffect(() => {
    if (!id) return;

    async function fetchEditionAndArticles() {
      try {
        const res = await fetch(`/api/editions/${id}`);
        if (!res.ok) throw new Error("Error al cargar la edición");
        const data = await res.json();
        setEdition(data);

        const articlesRes = await fetch(`/api/articles/edition/${data.number}`);
        const articlesData = await articlesRes.json();
        setArticles(articlesData);
      } catch (err) {
        setError(err.message || "Error desconocido");
      }
    }

    fetchEditionAndArticles();
  }, [id]);

  function parseTableOfContents() {
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
    const parsedArticles = [];
    let currentArticle = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const pageNumber = line.match(/^\d+/)?.[0] || null;

      if (pageNumber && /^\d+\s/.test(line)) {
        if (currentArticle) {
          parsedArticles.push(currentArticle);
        }

        const titleWithoutPage = line.replace(/^\d+\s*/, "");
        let matchedArticle = articles.find((article) =>
          titleWithoutPage.toLowerCase().includes(article.title.toLowerCase())
        );

        if (!matchedArticle && lines[i + 1]) {
          const possibleSubtitle = lines[i + 1].trim();
          matchedArticle = articles.find((article) =>
            possibleSubtitle.toLowerCase().includes(article.title.toLowerCase())
          );
        }

        currentArticle = {
          id: parsedArticles.length,
          pageNumber,
          title: titleWithoutPage,
          subtitle:
            !matchedArticle && lines[i + 1] ? lines[i + 1].trim() : null,
          author: null,
          isLinked: Boolean(matchedArticle),
          matchedArticle: matchedArticle || null,
          isSection: line.trim().toLowerCase() === "aktuelles",
        };
      } else if (currentArticle) {
        if (line.toLowerCase().startsWith("von ")) {
          currentArticle.author = line;
        } else if (!currentArticle.subtitle) {
          currentArticle.subtitle = line;
        }
      } else {
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

    if (currentArticle) {
      parsedArticles.push(currentArticle);
    }

    return parsedArticles;
  }

  // Función para manejar el click en un artículo
  function handleArticleClick(article, e) {
    e.preventDefault();
    if (article.matchedArticle?.legacyPath) {
      // Guardar la posición de scroll en sessionStorage
      sessionStorage.setItem("dossierScrollArticle", `article-${article.id}`);
      sessionStorage.setItem("dossierScrollPath", window.location.pathname);

      // Navegar al artículo normalmente
      router.push(article.matchedArticle.legacyPath);
    }
  }

  function renderTableOfContents() {
    const contents = parseTableOfContents();
    const displayContents = isExpanded ? contents : contents.slice(0, 6);

    return (
      <div className="space-y-3">
        {displayContents.map((article) => (
          <div
            key={article.id}
            id={`article-${article.id}`}
            ref={(el) => (articleRefs.current[`article-${article.id}`] = el)}
            className={`group p-5 rounded-xl border-2 transition-all duration-200 ${
              article.isLinked
                ? "border-blue-200 dark:border-blue-800 bg-gradient-to-r from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-800/10 hover:from-red-100 hover:to-red-50 dark:hover:from-red-900/30 dark:hover:to-red-800/20 shadow-sm hover:shadow-md"
                : article.isSection
                  ? "border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-red-25 dark:from-red-900/20 dark:to-red-800/10"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {article.isLinked ? (
              <a
                href={article.matchedArticle?.legacyPath || "#"}
                onClick={(e) => handleArticleClick(article, e)}
                className="block cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-200 group-hover:text-red-900 dark:group-hover:text-blue-100 leading-tight mb-2">
                      {article.title}
                    </h3>
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
                  <div className="ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1">
                    <svg
                      className="w-6 h-6 text-red-600 dark:text-red-400"
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
              </a>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {article.pageNumber && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-600 text-white">
                        {t("page")} {article.pageNumber}
                      </span>
                    )}
                    {article.isSection && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white">
                        {t("section")}
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-lg leading-tight mb-2 ${
                      article.isSection
                        ? "font-bold text-red-800 dark:text-red-200"
                        : "font-semibold text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {article.title}
                  </h3>
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
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 shadow-sm hover:shadow-md"
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
  if (!edition) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
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
        <div className="article-content font-serif text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200">
          {edition.summary ? (
            // Si contiene etiquetas HTML, renderizar como HTML
            /<\/?[a-z][\s\S]*>/i.test(edition.summary) ? (
              <div dangerouslySetInnerHTML={{ __html: edition.summary }} />
            ) : (
              // Si es texto plano, dividir en párrafos por saltos de línea
              edition.summary.split("\n").map((line, i) => (
                <p key={i} className="mb-4">
                  {line}
                </p>
              ))
            )
          ) : (
            <p>{t("noSummary")}</p>
          )}
        </div>
        <div className="clear-both"></div>
      </div>
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

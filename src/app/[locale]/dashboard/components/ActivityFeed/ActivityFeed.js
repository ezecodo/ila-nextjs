"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function ActivityFeed() {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 10;
  const locale = useLocale();
  const t = useTranslations("activity");

  useEffect(() => {
    fetch("/api/activity-log")
      .then((res) => res.json())
      .then((data) => {
        const parsedLogs = (data.logs || []).map((log) => ({
          ...log,
          metadata:
            typeof log.metadata === "string"
              ? JSON.parse(log.metadata)
              : log.metadata,
        }));
        console.log("🧾 Logs parseados:", parsedLogs);
        setLogs(parsedLogs);
        setTotalPages(Math.ceil(parsedLogs.length / logsPerPage));
      })
      .catch((error) => {
        console.error("❌ Error al cargar logs:", error);
      });
  }, []);

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!logs.length) {
    return (
      <div className="mt-6 text-gray-400 text-sm text-center py-8">
        {t("none")}
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-4xl mx-auto">
      <ul className="space-y-3">
        {currentLogs.map((log) => (
          <li
            key={log.id}
            className="bg-gray-50 border-l-4 border-red-600 rounded-r-lg p-4 hover:bg-white hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-gray-900">
                    {log.user?.name || "Usuario"}
                  </span>{" "}
                  <span className="text-gray-700">
                    {log.action === "CREATE_CAROUSEL" && log.carousel ? (
                      <>
                        {t("createdCarousel")}{" "}
                        <Link
                          href={`/dashboard/carousels/${log.carousel?.id}`}
                          className="text-red-700 hover:text-red-800 font-medium hover:underline"
                        >
                          {locale === "de"
                            ? log.carousel?.titleDE ||
                              log.carousel?.titleES ||
                              t("untitled")
                            : log.carousel?.titleES ||
                              log.carousel?.titleDE ||
                              t("untitled")}
                        </Link>
                        {log.carousel.beitragstyp?.nameES && (
                          <>
                            {" "}
                            {t("withType")}{" "}
                            <span className="font-semibold text-gray-800">
                              {locale === "de"
                                ? log.carousel.beitragstyp.name
                                : log.carousel.beitragstyp.nameES}
                            </span>
                          </>
                        )}
                        {log.carousel.region?.name && (
                          <>
                            {" "}
                            {t("inRegion")}{" "}
                            <span className="italic text-gray-600">
                              {log.carousel.region.name}
                            </span>
                          </>
                        )}
                      </>
                    ) : log.action === "DELETE_CAROUSEL" ? (
                      log.metadata ? (
                        <>
                          {t("deletedCarousel")}{" "}
                          <span className="font-semibold text-gray-800">
                            {locale === "de"
                              ? log.metadata.titleDE ||
                                log.metadata.titleES ||
                                t("untitled")
                              : log.metadata.titleES ||
                                log.metadata.titleDE ||
                                t("untitled")}
                          </span>
                          {log.metadata.beitragstyp && (
                            <>
                              {" "}
                              {t("withType")}{" "}
                              <span className="font-semibold text-gray-800">
                                {log.metadata.beitragstyp}
                              </span>
                            </>
                          )}
                          {log.metadata.region && (
                            <>
                              {" "}
                              {t("inRegion")}{" "}
                              <span className="italic text-gray-600">
                                {log.metadata.region}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <>{t("deletedCarousel")}</>
                      )
                    ) : log.action === "CREATE_ARTICLE" ? (
                      <>
                        {t("createdArticle")}{" "}
                        {log.metadata?.legacyPath ? (
                          <Link
                            href={log.metadata?.legacyPath || "#"}
                            className="text-red-700 hover:text-red-800 font-medium hover:underline"
                          >
                            {log.metadata?.title ||
                              log.article?.title ||
                              t("untitled")}
                          </Link>
                        ) : (
                          <span className="italic text-gray-500">
                            {log.metadata?.title ||
                              log.article?.title ||
                              t("untitled")}
                          </span>
                        )}
                        {log.metadata?.edition && (
                          <span className="block mt-1 text-xs text-gray-500">
                            {t("inEdition")}{" "}
                            <span className="font-semibold text-gray-700">
                              {log.metadata.edition.number}
                            </span>{" "}
                            – {log.metadata.edition.title}
                            {log.metadata.edition.datePublished && (
                              <>
                                {" "}
                                –{" "}
                                <span className="font-semibold">
                                  {new Date(
                                    log.metadata.edition.datePublished
                                  ).toLocaleDateString("en-GB", {
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              </>
                            )}
                          </span>
                        )}
                      </>
                    ) : log.action === "CREATE_EVENT" ? (
                      <>
                        {t("createdEvent")}{" "}
                        <span className="font-semibold text-gray-800">
                          {log.metadata?.title || t("untitled")}
                        </span>
                        {log.metadata?.date && (
                          <span className="ml-1 text-gray-600">
                            (
                            {new Date(log.metadata.date).toLocaleDateString(
                              locale
                            )}
                            )
                          </span>
                        )}
                      </>
                    ) : log.action === "TRANSLATE_ARTICLE" ? (
                      <>
                        {t("translatedArticle")}{" "}
                        <Link
                          href={`/es/articles/${log.articleId}`}
                          className="text-red-700 hover:text-red-800 font-medium hover:underline"
                        >
                          {log.article?.title || t("untitled")}
                        </Link>
                      </>
                    ) : log.action === "REVIEW_TRANSLATION" ? (
                      <>
                        {t("reviewedTranslation")}{" "}
                        {log.article?.legacyPath ? (
                          <Link
                            href={`/es${log.article.legacyPath}`}
                            className="text-red-700 hover:text-red-800 font-medium hover:underline"
                          >
                            {log.article?.title || t("untitled")}
                          </Link>
                        ) : (
                          <span className="italic text-gray-500">
                            {log.article?.title || t("untitled")}
                          </span>
                        )}
                      </>
                    ) : log.action === "UPDATE_ARTICLE" ? (
                      <>
                        {t("updatedArticle")}{" "}
                        {log.metadata?.legacyPath ? (
                          <Link
                            href={log.metadata.legacyPath}
                            className="text-red-700 hover:text-red-800 font-medium hover:underline"
                          >
                            {log.metadata?.title ||
                              log.article?.title ||
                              t("untitled")}
                          </Link>
                        ) : log.article?.legacyPath ? (
                          <Link
                            href={log.article.legacyPath}
                            className="text-red-700 hover:text-red-800 font-medium hover:underline"
                          >
                            {log.article?.title || t("untitled")}
                          </Link>
                        ) : (
                          <span className="italic text-gray-500">
                            {log.article?.title || t("untitled")}
                          </span>
                        )}
                        {log.metadata?.edition && (
                          <span className="block mt-1 text-xs text-gray-500">
                            {t("inEdition")}{" "}
                            <span className="font-semibold text-gray-700">
                              {log.metadata.edition.number}
                            </span>{" "}
                            – {log.metadata.edition.title}
                            {log.metadata.edition.datePublished && (
                              <>
                                {" "}
                                –{" "}
                                <span className="font-semibold">
                                  {new Date(
                                    log.metadata.edition.datePublished
                                  ).toLocaleDateString("en-GB", {
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              </>
                            )}
                          </span>
                        )}
                      </>
                    ) : log.action === "SUBMIT_TRANSLATION" ? (
                      <>
                        {t("SUBMIT_TRANSLATION", {
                          number: log.metadata?.editionNumber ?? "—",
                        })}
                      </>
                    ) : (
                      t("default")
                    )}
                  </span>
                </p>
              </div>

              <time className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                {new Date(log.createdAt).toLocaleString()}
              </time>
            </div>
          </li>
        ))}
      </ul>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {t("pagination.prev")}
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                    currentPage === number
                      ? "bg-red-600 text-white"
                      : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {number}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {t("pagination.next")}
          </button>
        </div>
      )}
    </div>
  );
}

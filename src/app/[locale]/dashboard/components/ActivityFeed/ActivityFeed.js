"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FaShoppingCart, FaUserPlus } from "react-icons/fa";

export default function ActivityFeed() {
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [newOrders, setNewOrders] = useState(0);
  const [newSubscriptions, setNewSubscriptions] = useState(0);
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
  // Cargar contadores de pedidos
  useEffect(() => {
    async function fetchOrdersCount() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();
        setNewOrders(data.newOrdersCount || 0);
      } catch (err) {
        console.error("Error cargando pedidos:", err);
      }
    }
    fetchOrdersCount();
  }, []);

  // Cargar contadores de suscripciones
  useEffect(() => {
    async function fetchSubscriptionsCount() {
      try {
        const res = await fetch("/api/subscriptions", { cache: "no-store" });
        const data = await res.json();
        setNewSubscriptions(data.newSubscriptionsCount || 0);
      } catch (err) {
        console.error("Error cargando Abos:", err);
      }
    }
    fetchSubscriptionsCount();
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
      {/* === ALERTAS MINIMALISTAS SIN BORDES ROJOS === */}
      {(newOrders > 0 || newSubscriptions > 0) && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Alerta Pedidos */}
          {newOrders > 0 && (
            <Link
              href="/dashboard/orders"
              className="flex items-center justify-between bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <FaShoppingCart className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {newOrders}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("pendingOrders")}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {t("newOrders", { count: newOrders })}
                  </p>
                </div>
              </div>
              <div className="text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors text-sm">
                →
              </div>
            </Link>
          )}

          {/* Alerta Suscripciones */}
          {newSubscriptions > 0 && (
            <Link
              href="/dashboard/subscriptions"
              className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-800 border border-gray-100 dark:border-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FaUserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {newSubscriptions}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t("newSubscriptions")}
                  </p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {t("newSubscriptionsCount", {
                      count: newSubscriptions,
                    })}
                  </p>
                </div>
              </div>
              <div className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm">
                →
              </div>
            </Link>
          )}
        </div>
      )}

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
                    {log.action === "ASSIGN_TRANSLATOR" && log.metadata ? (
                      <>
                        {t("assignedDossier")}{" "}
                        <span className="font-semibold text-gray-800">
                          ila {log.metadata.editionNumber}
                          {log.metadata.editionTitle &&
                            ` - ${log.metadata.editionTitle}`}
                        </span>{" "}
                        {t("to")}{" "}
                        <span className="font-semibold text-gray-800">
                          {log.metadata.translatorName}
                        </span>{" "}
                        {t("forTranslation")}
                      </>
                    ) : log.action === "CREATE_CAROUSEL" && log.carousel ? (
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
                      log.metadata ? (
                        // 📚 Es un dossier (edition)
                        <>
                          {t("REVIEW_TRANSLATION_PREFIX")}{" "}
                          <Link
                            href={`/es/editions/${log.metadata?.editionId}`}
                            className="text-red-700 hover:text-red-800 font-semibold hover:underline"
                          >
                            ila {log.metadata.editionNumber ?? "—"}
                            {log.metadata.editionTitle &&
                              ` - ${log.metadata.editionTitle}`}
                          </Link>{" "}
                          {t("REVIEW_TRANSLATION_SUFFIX")}
                        </>
                      ) : (
                        // 📄 Es un artículo (legacy, por si acaso)
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
                      )
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
                        {t("SUBMIT_TRANSLATION_PREFIX")}{" "}
                        <span className="font-semibold text-gray-800">
                          ila {log.metadata?.editionNumber ?? "—"}
                          {log.metadata?.editionTitle &&
                            ` - ${log.metadata.editionTitle}`}
                        </span>{" "}
                        {t("SUBMIT_TRANSLATION_SUFFIX")}
                      </>
                    ) : log.action === "ACTIVATE_PDF_ABO" ? (
                      <>
                        {t("activatedPdfAbo")}
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

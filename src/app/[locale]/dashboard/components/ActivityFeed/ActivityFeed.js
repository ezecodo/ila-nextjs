"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

export default function ActivityFeed() {
  const [logs, setLogs] = useState([]);
  const locale = useLocale();
  const t = useTranslations("activity");

  useEffect(() => {
    fetch("/api/activity-log")
      .then((res) => res.json())
      .then((data) => {
        console.log("🧾 Logs recibidos:", data.logs);
        setLogs(data.logs || []);
      })
      .catch((error) => {
        console.error("❌ Error al cargar logs:", error);
      });
  }, []);

  if (!logs.length) {
    return (
      <div className="mt-8 text-gray-500 text-sm text-center">{t("none")}</div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">{t("recent")}</h2>
      <ul className="space-y-3">
        {logs.map((log) => (
          <li key={log.id} className="bg-white shadow p-4 rounded text-sm">
            <p>
              <strong>{log.user?.name || "Usuario"}</strong>{" "}
              {log.action === "CREATE_CAROUSEL" && log.carousel ? (
                <>
                  {t("createdCarousel")}{" "}
                  <Link
                    href={`/dashboard/carousels/${log.carousel?.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    “
                    {locale === "de"
                      ? log.carousel?.titleDE ||
                        log.carousel?.titleES ||
                        t("untitled")
                      : log.carousel?.titleES ||
                        log.carousel?.titleDE ||
                        t("untitled")}
                    ”
                  </Link>
                  {log.carousel.beitragstyp?.nameES && (
                    <>
                      {" "}
                      {t("withType")}{" "}
                      <span className="font-semibold">
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
                      <span className="italic">{log.carousel.region.name}</span>
                    </>
                  )}
                </>
              ) : log.action === "DELETE_CAROUSEL" ? (
                log.metadata ? (
                  <>
                    {t("deletedCarousel")}{" "}
                    <span className="font-semibold">
                      “
                      {locale === "de"
                        ? log.metadata.titleDE ||
                          log.metadata.titleES ||
                          t("untitled")
                        : log.metadata.titleES ||
                          log.metadata.titleDE ||
                          t("untitled")}
                      ”
                    </span>
                    {log.metadata.beitragstyp && (
                      <>
                        {" "}
                        {t("withType")}{" "}
                        <span className="font-semibold">
                          {log.metadata.beitragstyp}
                        </span>
                      </>
                    )}
                    {log.metadata.region && (
                      <>
                        {" "}
                        {t("inRegion")}{" "}
                        <span className="italic">{log.metadata.region}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>{t("deletedCarousel")}</>
                )
              ) : log.action === "CREATE_ARTICLE" ? (
                <>
                  {t("createdArticle")}{" "}
                  <Link
                    href={`/dashboard/articles/${log.articleId}`}
                    className="text-blue-600 hover:underline"
                  >
                    “
                    {log.article?.title ||
                      log.metadata?.titleDE ||
                      log.metadata?.titleES ||
                      t("untitled")}
                    ”
                  </Link>
                </>
              ) : log.action === "TRANSLATE_ARTICLE" ? (
                <>
                  {t("translatedArticle")}{" "}
                  <Link
                    href={`/es/articles/${log.articleId}`}
                    className="text-blue-600 hover:underline"
                  >
                    “{log.article?.title || t("untitled")}”
                  </Link>
                </>
              ) : log.action === "REVIEW_TRANSLATION" ? (
                <>
                  {t("reviewedTranslation")}{" "}
                  <Link
                    href={`/es/articles/${log.articleId}`}
                    className="text-blue-600 hover:underline"
                  >
                    “{log.article?.title || t("untitled")}”
                  </Link>
                </>
              ) : (
                t("default")
              )}
            </p>

            <p className="text-xs text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

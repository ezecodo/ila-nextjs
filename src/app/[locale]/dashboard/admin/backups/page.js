"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  FaDatabase,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaArchive,
} from "react-icons/fa";

// Cron corre a diario — margen sobre 24h antes de marcar como "atrasado"
const STALE_HOURS = 26;

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  const mb = bytes / 1024 / 1024;
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  return `${mb.toFixed(1)} MB`;
}

export default function BackupsAdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const t = useTranslations("backupsAdmin");
  const locale = useLocale();

  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    async function loadBackups() {
      try {
        const res = await fetch("/api/admin/backups");
        const data = await res.json();
        setBackups(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error loading backups:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBackups();
  }, []);

  const dateFormatter = new Intl.DateTimeFormat(
    locale === "es" ? "es-ES" : "de-DE",
    { dateStyle: "medium", timeStyle: "short" },
  );

  const lastSuccess = backups.find((b) => b.status === "success");
  const hoursSinceLastSuccess = lastSuccess
    ? (Date.now() - new Date(lastSuccess.createdAt).getTime()) /
      1000 /
      60 /
      60
    : null;
  const isStale = lastSuccess ? hoursSinceLastSuccess > STALE_HOURS : true;
  const lastSuccessDate = lastSuccess
    ? dateFormatter.format(new Date(lastSuccess.createdAt))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#557a4c] to-[#46663f] rounded-md flex items-center justify-center shadow-lg">
              <FaDatabase className="text-white text-xl" />
            </div>
            {t("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t("subtitle")}
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#89B881]/40 dark:border-[#89B881]/25 bg-[#89B881]/10 dark:bg-[#2c4327]/20 p-5 lg:p-6">
          <h2 className="flex items-center gap-2 font-bold text-[#2c4327] dark:text-[#89B881] mb-3">
            <FaArchive className="shrink-0" />
            {t("missionTitle")}
          </h2>
          <p className="text-sm text-[#2c4327]/90 dark:text-green-100/80 leading-relaxed mb-3">
            {t("missionText1")}
          </p>
          <p className="text-sm text-[#2c4327]/90 dark:text-green-100/80 leading-relaxed">
            {t("missionText2")}
          </p>
          <p className="text-sm italic text-[#2c4327]/70 dark:text-[#89B881]/80 mt-4 text-right">
            {t("missionSignature")}
          </p>
        </div>

        {!loading && (
          <div
            className={`mb-8 rounded-xl border p-4 flex items-start gap-3 ${
              lastSuccess && !isStale
                ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
            }`}
          >
            {lastSuccess && !isStale ? (
              <FaCheckCircle className="mt-0.5 shrink-0" />
            ) : (
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
            )}
            <div>
              {lastSuccess ? (
                <>
                  <p className="font-semibold">
                    {isStale ? t("statusStaleTitle") : t("statusOkTitle")}
                  </p>
                  <p className="text-sm mt-0.5">
                    {isStale
                      ? t("statusStaleDesc", { date: lastSuccessDate })
                      : t("statusOkDesc", { date: lastSuccessDate })}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">{t("statusNoneTitle")}</p>
                  <p className="text-sm mt-0.5">{t("statusNoneDesc")}</p>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {t("noBackups")}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">{t("colDate")}</th>
                  <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-medium">{t("colSize")}</th>
                  <th className="px-4 py-3 font-medium">
                    {t("colDestination")}
                  </th>
                  <th className="px-4 py-3 font-medium">{t("colFile")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {backups.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100">
                      {dateFormatter.format(new Date(b.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "success" ? (
                        <span className="inline-flex items-center gap-1.5 text-green-700 dark:text-green-400">
                          <FaCheckCircle /> {t("success")}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400"
                          title={b.errorMessage || ""}
                        >
                          <FaTimesCircle /> {t("failed")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {formatBytes(b.sizeBytes)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {b.destination === "google_drive_uploads"
                        ? t("destinationUploads")
                        : t("destinationDb")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 truncate max-w-[240px]">
                      {b.destination === "google_drive_uploads"
                        ? t("filesAdded", { count: b.filesTransferred ?? 0 })
                        : b.fileName || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { FaBullseye, FaArrowRight, FaInfoCircle } from "react-icons/fa";
import { computeProjection, TARGET_PER_DOSSIER } from "@/lib/redaktionStats";

export default function PrognoseSummary() {
  const t = useTranslations("redaktion");
  const locale = useLocale();
  const isES = locale === "es";
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/dashboard/content-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && !d.error) setData(d);
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const { remaining, recentAvg, estRecent } = computeProjection(
    data.backlogRemaining ?? 0,
    data.monthly || []
  );

  const fmtNum = (n) =>
    n.toLocaleString(isES ? "es-ES" : "de-DE", { maximumFractionDigits: 1 });
  const finishFmt = new Intl.DateTimeFormat(isES ? "es-ES" : "de-DE", {
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      href={`/${locale}/dashboard/redaktion`}
      className="group block rounded-xl border border-[#BD0E0D]/25 border-l-4 border-l-[#BD0E0D] bg-gradient-to-br from-red-50 via-white to-white shadow-sm hover:shadow-md transition-shadow p-4 mb-6 text-left"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#BD0E0D] text-white shrink-0">
          <FaBullseye size={13} />
        </span>
        <h2 className="text-base font-bold text-[#BD0E0D]">
          {t("projectionTitle")}
        </h2>
        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-[#BD0E0D] group-hover:gap-2 transition-all">
          {t("viewDetail")} <FaArrowRight size={10} />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat
          label={t("totalArticles")}
          value={fmtNum(data.totalArticles ?? 0)}
          hint={t("totalArticlesHint")}
        />
        <Stat
          label={t("remaining")}
          value={fmtNum(remaining)}
          hint={t("remainingHint", { n: TARGET_PER_DOSSIER })}
        />
        <Stat
          label={t("recentPace")}
          value={fmtNum(recentAvg)}
          hint={t("recentPaceHint")}
        />
        <Stat
          label={t("estimatedFinish")}
          hint={t("estimatedFinishHint")}
          value={
            estRecent
              ? finishFmt.format(estRecent.finish)
              : remaining <= 0
                ? "✓"
                : "—"
          }
        />
        <Stat
          label={t("translatedES")}
          hint={t("translatedESHint")}
          value={fmtNum(data.translatedES ?? 0)}
          accent
        />
      </div>
    </Link>
  );
}

function Stat({ label, value, hint, accent }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        accent
          ? "border-[#BD0E0D]/30 bg-[#BD0E0D]/5"
          : "border-gray-100 bg-white"
      } ${hint ? "cursor-help" : ""}`}
      title={hint || undefined}
    >
      <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
        {label}
        {hint && (
          <FaInfoCircle
            size={9}
            className="text-gray-300 shrink-0"
            aria-hidden="true"
          />
        )}
      </p>
      <p
        className={`text-lg sm:text-xl font-bold ${
          accent ? "text-[#BD0E0D]" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

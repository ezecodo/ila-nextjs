"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import { FaBullseye, FaInfoCircle } from "react-icons/fa";
import { computeProjection, TARGET_PER_DOSSIER } from "@/lib/redaktionStats";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ROW_HEIGHT = 30;

export default function RedaktionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("redaktion");
  const locale = useLocale();
  const isES = locale === "es";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin")
      router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/dashboard/content-stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  const monthFmt = new Intl.DateTimeFormat(isES ? "es-ES" : "de-DE", {
    month: "short",
    year: "2-digit",
  });

  const dossiers = (data?.dossiers || []).map((d) => ({
    ...d,
    name: `ila ${d.number}`,
    displayTitle: isES && d.titleES ? d.titleES : d.title,
  }));

  const totalArticles = dossiers.reduce((s, d) => s + d.articleCount, 0);
  const emptyDossiers = dossiers.filter((d) => d.articleCount === 0).length;

  const rawMonthly = data?.monthly || [];
  const { remaining, avgAll, recentAvg, estAll, estRecent, currentKey } =
    computeProjection(data?.backlogRemaining ?? 0, rawMonthly);

  const monthly = rawMonthly.map((m) => {
    const [y, mo] = m.month.split("-").map(Number);
    return {
      ...m,
      label: monthFmt.format(new Date(y, mo - 1, 1)),
      isCurrent: m.month === currentKey,
    };
  });

  const fmtNum = (n) =>
    n.toLocaleString(isES ? "es-ES" : "de-DE", { maximumFractionDigits: 1 });
  const finishFmt = new Intl.DateTimeFormat(isES ? "es-ES" : "de-DE", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-xs text-gray-400">{t("subtitle")}</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <IlaLoader />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <Kpi label={t("kpiDossiers")} value={dossiers.length} />
            <Kpi label={t("kpiArticles")} value={totalArticles} />
            <Kpi
              label={t("kpiEmpty")}
              value={emptyDossiers}
              highlight={emptyDossiers > 0}
            />
          </div>

          {/* Artículos por mes */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-1">
              {t("monthlyTitle")}
            </h2>
            <p className="text-xs text-gray-400 mb-4">{t("currentMonthNote")}</p>
            {monthly.length === 0 ? (
              <p className="text-xs text-gray-400 italic">{t("noData")}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={monthly}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "#fef2f2" }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar
                    dataKey="count"
                    name={t("kpiArticles")}
                    radius={[3, 3, 0, 0]}
                  >
                    {monthly.map((m) => (
                      <Cell
                        key={m.month}
                        fill={m.isCurrent ? "#f3b0af" : "#BD0E0D"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Proyección */}
          <div className="rounded-xl border border-[#BD0E0D]/25 shadow-md p-5 bg-gradient-to-br from-red-50 via-white to-white border-l-4 border-l-[#BD0E0D]">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#BD0E0D] text-white shrink-0">
                <FaBullseye size={13} />
              </span>
              <h2 className="text-base font-bold text-[#BD0E0D]">
                {t("projectionTitle")}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mb-4 ml-9">
              {t("targetNote", { n: TARGET_PER_DOSSIER })}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi
                label={t("remaining")}
                value={fmtNum(remaining)}
                highlight
                hint={t("remainingHint", { n: TARGET_PER_DOSSIER })}
              />
              <Kpi
                label={t("avgPerMonth")}
                value={fmtNum(avgAll)}
                hint={t("avgPerMonthHint")}
              />
              <Kpi
                label={t("recentPace")}
                value={fmtNum(recentAvg)}
                hint={t("recentPaceHint")}
              />
              <Kpi
                label={t("estimatedFinish")}
                hint={t("estimatedFinishHint")}
                value={
                  estRecent
                    ? finishFmt.format(estRecent.finish)
                    : estAll
                      ? finishFmt.format(estAll.finish)
                      : remaining <= 0
                        ? "✓"
                        : "—"
                }
              />
            </div>
            {(estAll || estRecent) && remaining > 0 && (
              <div className="mt-4 space-y-1 text-xs text-gray-500">
                {estRecent && (
                  <p>
                    {t("estByRecent", {
                      months: estRecent.monthsNeeded,
                      date: finishFmt.format(estRecent.finish),
                    })}
                  </p>
                )}
                {estAll && (
                  <p>
                    {t("estByAvg", {
                      months: estAll.monthsNeeded,
                      date: finishFmt.format(estAll.finish),
                    })}
                  </p>
                )}
              </div>
            )}
            {remaining <= 0 && (
              <p className="mt-4 text-xs text-green-600 font-semibold">
                {t("targetReached")}
              </p>
            )}
          </div>

          {/* Artículos por dossier (scrollable) */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-700">
                {t("dossiersTitle")}
              </h2>
              <span className="text-xs text-gray-400">
                {t("dossiersHint")}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-[11px] text-gray-500">
              <LegendDot color="#BD0E0D" label={t("legendLoaded")} />
              <LegendDot color="#e5e7eb" label={t("legendEmpty")} />
            </div>
            <div className="max-h-[480px] overflow-y-auto pr-1">
              <ResponsiveContainer
                width="100%"
                height={Math.max(dossiers.length * ROW_HEIGHT, 200)}
              >
                <BarChart
                  layout="vertical"
                  data={dossiers}
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={60}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: "#fef2f2" }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value) => [value, t("kpiArticles")]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.displayTitle
                        ? `${label} — ${item.displayTitle}`
                        : label;
                    }}
                  />
                  <Bar dataKey="articleCount" radius={[0, 3, 3, 0]}>
                    {dossiers.map((d) => (
                      <Cell
                        key={d.id}
                        fill={d.articleCount === 0 ? "#e5e7eb" : "#BD0E0D"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function Kpi({ label, value, highlight, hint }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 ${
        hint ? "cursor-help" : ""
      }`}
      title={hint || undefined}
    >
      <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
        {label}
        {hint && (
          <FaInfoCircle
            size={10}
            className="text-gray-300 shrink-0"
            aria-hidden="true"
          />
        )}
      </p>
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-[#BD0E0D]" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

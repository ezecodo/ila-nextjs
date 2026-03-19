"use client";

import { useEffect, useState } from "react";

const PERIODS = [
  { value: "day", label: "Hoy" },
  { value: "yesterday", label: "Ayer" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

const fmt = (n) => (n != null ? Number(n).toLocaleString("de-DE") : "—");

export default function TopArticles() {
  const [period, setPeriod] = useState("week");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const date = period === "yesterday" ? "yesterday" : "today";
    const matomoPeriod = period === "yesterday" ? "day" : period;

    fetch(`/api/analytics/articles?period=${matomoPeriod}&date=${date}`)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.articles)) setArticles(d.articles); })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-bold text-gray-700">Artículos más visitados</h2>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                period === p.value
                  ? "bg-[#BD0E0D] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#BD0E0D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <p className="text-xs text-gray-400 italic text-center py-4">Sin datos para este período</p>
      ) : (
        <div className="space-y-2">
          {articles.map((page, i) => {
            const max = articles[0]?.nb_visits || 1;
            const pct = Math.round(((page.nb_visits || 0) / max) * 100);
            const displayTitle = page.title || (page.label || "")
              .replace(/\/(de|es)\/(ausgaben|online)\//, "")
              .replace(/\/$/, "") || page.label;
            const tag = page.edition
              ? `ILA ${page.edition.number}`
              : page.isInPrintEdition === false
              ? "Nur Online"
              : null;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-5 text-right font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex-1 min-w-0 mr-2">
                      <a
                        href={`https://ila-web.de${page.label}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-800 font-medium hover:text-[#BD0E0D] hover:underline line-clamp-1"
                        title={displayTitle}
                      >
                        {displayTitle}
                      </a>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {tag && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                            {tag}
                          </span>
                        )}
                        {page.authors?.length > 0 && (
                          <span className="text-[10px] text-gray-400 truncate">
                            {page.authors.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#BD0E0D] flex-shrink-0">{fmt(page.nb_visits)}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#BD0E0D]/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

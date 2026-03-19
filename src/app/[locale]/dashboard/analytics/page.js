"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { FaUsers, FaEye, FaClock, FaMobileAlt, FaDesktop, FaTabletAlt, FaGlobe, FaSync } from "react-icons/fa";

function StatCard({ icon, label, value, sub, diff }) {
  const positive = diff > 0;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#BD0E0D] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
        {diff != null && diff !== 0 && (
          <p className={`text-xs font-semibold ${positive ? "text-green-600" : "text-red-500"}`}>
            {positive ? "▲" : "▼"} {Math.abs(diff)} vs ayer
          </p>
        )}
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function DeviceIcon({ label }) {
  const l = (label || "").toLowerCase();
  if (l.includes("mobile") || l.includes("smartphone")) return <FaMobileAlt size={12} />;
  if (l.includes("tablet")) return <FaTabletAlt size={12} />;
  return <FaDesktop size={12} />;
}

const fmt = (n) => (n != null ? Number(n).toLocaleString("de-DE") : "—");
const fmtTime = (s) => s != null ? `${Math.floor(s / 60)}m ${s % 60}s` : "—";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("hourly"); // hourly | weekly

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && session?.user?.role !== "admin") router.push("/");
  }, [status, session, router]);

  const fetchData = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    setError(null);
    fetch("/api/analytics/stats")
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [status]);

  const t = data?.today || {};
  const y = data?.yesterday || {};

  // Combinar horas hoy + ayer para el gráfico
  const hourlyData = (data?.todayHourly || []).map((h, i) => ({
    ...h,
    visitsYesterday: data?.yesterdayHourly?.[i]?.visits ?? 0,
    visitorsYesterday: data?.yesterdayHourly?.[i]?.visitors ?? 0,
  }));

  // Hora actual en Europa/Berlin
  const nowHour = new Date().toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
  }).replace(" Uhr", "").padStart(2, "0") + ":00";

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-400">
            Hora actual (Berlin): <span className="font-semibold text-gray-600">{nowHour}</span>
            {" · "}Actualizado cada 5 min
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors disabled:opacity-50"
        >
          <FaSync size={11} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {loading && <div className="flex justify-center py-20"><IlaLoader /></div>}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">Error: {error}</div>}

      {!loading && !error && data && (
        <>
          {/* KPIs hoy vs ayer */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<FaUsers size={16} />}
              label="Visitantes únicos hoy"
              value={fmt(t.nb_uniq_visitors)}
              diff={(t.nb_uniq_visitors ?? 0) - (y.nb_uniq_visitors ?? 0)}
            />
            <StatCard
              icon={<FaEye size={16} />}
              label="Visitas hoy"
              value={fmt(t.nb_visits)}
              diff={(t.nb_visits ?? 0) - (y.nb_visits ?? 0)}
            />
            <StatCard
              icon={<FaEye size={16} />}
              label="Páginas vistas hoy"
              value={fmt(t.nb_actions)}
              diff={(t.nb_actions ?? 0) - (y.nb_actions ?? 0)}
            />
            <StatCard
              icon={<FaClock size={16} />}
              label="Tiempo promedio"
              value={fmtTime(t.avg_time_on_site)}
              sub={`Ayer: ${fmtTime(y.avg_time_on_site)}`}
            />
          </div>

          {/* Gráfico principal */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700">Visitantes</h2>
              <div className="flex gap-2">
                {[{ v: "hourly", l: "Por hora (hoy vs ayer)" }, { v: "weekly", l: "Últimos 7 días" }].map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setView(o.v)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      view === o.v ? "bg-[#BD0E0D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              {view === "hourly" ? (
                <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#BD0E0D" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#BD0E0D" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="yesterdayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="visitsYesterday" name="Visitas ayer" stroke="#94a3b8" fill="url(#yesterdayGrad)" strokeWidth={1.5} dot={false} />
                  <Area type="monotone" dataKey="visits" name="Visitas hoy" stroke="#BD0E0D" fill="url(#todayGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              ) : (
                <BarChart data={data.weekly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="visitors" name="Visitantes únicos" fill="#BD0E0D" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="visits" name="Visitas" fill="#fca5a5" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top páginas */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Páginas más vistas (semana)</h2>
              <div className="space-y-2">
                {data.topPages.slice(0, 10).map((page, i) => {
                  const total = data.topPages[0]?.nb_visits || 1;
                  const pct = Math.round(((page.nb_visits || 0) / total) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-gray-700 truncate max-w-[70%]">{page.label || "/"}</span>
                          <span className="text-xs font-bold text-gray-600">{fmt(page.nb_visits)}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#BD0E0D] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {data.topPages.length === 0 && <p className="text-xs text-gray-400 italic">Sin datos</p>}
              </div>
            </div>

            <div className="space-y-4">
              {/* Dispositivos */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-3">Dispositivos</h2>
                <div className="space-y-2">
                  {data.devices.map((d, i) => {
                    const total = data.devices.reduce((acc, x) => acc + (x.nb_visits || 0), 0) || 1;
                    const pct = Math.round(((d.nb_visits || 0) / total) * 100);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-gray-400"><DeviceIcon label={d.label} /></span>
                        <span className="text-xs text-gray-600 flex-1 truncate">{d.label}</span>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#BD0E0D] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Países */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FaGlobe size={12} className="text-[#BD0E0D]" /> Países (semana)
                </h2>
                <div className="space-y-1.5">
                  {data.countries.map((c, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{c.label}</span>
                      <span className="text-xs font-bold text-gray-700">{fmt(c.nb_visits)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

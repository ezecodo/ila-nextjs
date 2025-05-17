"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("stats");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err?.message || err);
        setError("Error al cargar estadísticas.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return null;
  if (error) return <p className="text-center text-red-500">{t("error")}</p>;

  return (
    <div className="flex flex-wrap gap-4 items-center justify-start">
      <StatCard
        label={t("articles")}
        value={stats.totalArticles}
        color="text-blue-600"
        href="/dashboard/articles"
      />
      <StatCard
        label={t("editions")}
        value={stats.totalEditions}
        color="text-green-600"
      />
      <StatCard
        label={t("users")}
        value={stats.totalUsers}
        color="text-yellow-600"
      />
      <StatCard
        label={t("events")}
        value={stats.totalEvents}
        color="text-purple-600"
      />
      <StatCard
        label={t("favorites")}
        value={stats.totalLikedArticles}
        icon={<Heart size={18} className="text-red-500 ml-1" />}
        color="text-red-600"
      />
    </div>
  );
};

// 🧩 Componente reutilizable
function StatCard({ label, value, color, icon, onClick, href }) {
  const content = (
    <div
      onClick={onClick}
      className={`cursor-pointer min-w-[120px] px-3 py-2 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm`}
    >
      <span className={`font-bold ${color}`}>{value}</span>
      <span className="text-gray-600">{label}</span>
      {icon && icon}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default DashboardStats;

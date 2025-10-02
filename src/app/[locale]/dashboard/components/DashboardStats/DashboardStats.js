"use client";

import { useState, useEffect } from "react";
/* import { Heart } from "lucide-react"; */
import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  FaFileAlt,
  FaBook,
  FaRegNewspaper,
  FaShoppingCart,
  FaLanguage,
  FaSlidersH,
  FaCog,
  FaQuestionCircle,
} from "react-icons/fa";

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
    <div className="flex flex-wrap gap-2 items-center justify-start">
      <StatCard
        icon={
          <span
            className="font-serif text-lg font-bold text-red-600"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }} // 👈 reemplazar con la futura fuente
          >
            ila
          </span>
        }
        label=""
        value=""
        color="text-purple-600"
        href="/dashboard/activity"
      />
      <StatCard
        icon={<FaFileAlt size={18} className="text-blue-600" />}
        label={t("articles")}
        value={stats.totalArticles}
        color="text-blue-600"
        href="/dashboard/articles"
      />
      <StatCard
        icon={<FaBook size={18} className="text-green-600" />}
        label={t("editions")}
        value={stats.totalEditions}
        color="text-green-600"
        href="/dashboard/editions"
      />{" "}
      <StatCard
        icon={<FaRegNewspaper size={18} className="text-indigo-600" />}
        label="Aktuelles"
        value={stats.totalAktuelles}
        color="text-indigo-600"
        href="/dashboard/aktuelles"
      />
      {/*  <StatCard
        label={t("users")}
        value={stats.totalUsers}
        color="text-yellow-600"
      /> */}
      <StatCard
        label={t("events")}
        value={stats.totalEvents}
        color="text-purple-600"
        href="/dashboard/events"
      />
      <StatCard
        icon={<FaSlidersH size={18} className="text-pink-600" />}
        label="Carruseles"
        color="text-pink-600"
        href="/dashboard/carousels"
      />
      <StatCardDropdown
        icon={<FaLanguage size={18} className="text-teal-600" />}
        label={t("translations")}
        color="text-teal-600"
        items={[
          {
            label: t("assignTranslations"),
            href: "/dashboard/reviewer/assign",
          },
          {
            label: t("reviewTranslations"),
            href: "/dashboard/reviewer/review",
          },
        ]}
      />
      {/*  <StatCard
        label={t("favorites")}
        value={stats.totalLikedArticles}
        icon={<Heart size={18} className="text-red-500 ml-1" />}
        color="text-red-600"
      /> */}
      <StatCard
        icon={<FaShoppingCart size={18} className="text-orange-600" />}
        label={t("orders")} // 👈 puedes traducir con t("orders") si lo agregamos al i18n
        value={stats.totalOrders}
        color="text-orange-600"
        href="/dashboard/orders" // 👈 futura página de administración de pedidos
      />
      <StatCard
        icon={<FaCog size={18} className="text-gray-600" />}
        label={t("account")}
        color="text-gray-600"
        href="/dashboard/account" // 👈 ajusta la ruta a donde esté tu Configuración
      />
      <StatCard
        icon={<FaQuestionCircle size={18} className="text-blue-600" />}
        label="" // 👈 vacío
        value="" // 👈 sin número
        color="text-blue-600"
        href="/dashboard/faq"
      />
    </div>
  );
};

// 🧩 Componente reutilizable
function StatCard({ label, value, color, icon, onClick, href }) {
  const isCompact = !label && !value; // 👈 detectar FAQ

  const content = (
    <div
      onClick={onClick}
      className={`cursor-pointer flex-shrink-0 ${
        isCompact ? "w-10 h-10 justify-center" : "min-w-[110px] px-4 py-3"
      } bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm`}
    >
      {icon && <span>{icon}</span>}
      {!isCompact && (
        <>
          <span className={`font-bold ${color}`}>{value}</span>
          <span className="text-gray-600 whitespace-nowrap">{label}</span>
        </>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
export function StatCardDropdown({ icon, label, color, items }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Botón */}
      <div className="cursor-pointer min-w-[140px] px-4 py-3 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-3 text-sm">
        {icon && <span>{icon}</span>}
        <span className={`font-bold ${color}`}>{label}</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-56">
          <ul className="py-2 text-sm text-gray-700">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 hover:bg-gray-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DashboardStats;

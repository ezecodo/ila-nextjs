"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  const fullPathname = usePathname();

  // Remover el locale del pathname (ej: /de/dashboard/articles -> /dashboard/articles)
  const pathname = fullPathname?.replace(/^\/(de|es)/, "") || fullPathname;

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
            className="font-serif text-lg font-bold"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            ila
          </span>
        }
        label=""
        value=""
        href="/dashboard/activity"
        pathname={pathname}
      />
      <StatCard
        icon={<FaFileAlt size={18} />}
        label={t("articles")}
        value={stats.totalArticles}
        href="/dashboard/articles"
        pathname={pathname}
      />
      <StatCard
        icon={<FaBook size={18} />}
        label={t("editions")}
        value={stats.totalEditions}
        href="/dashboard/editions"
        pathname={pathname}
      />
      <StatCard
        icon={<FaRegNewspaper size={18} />}
        label="Aktuelles"
        value={stats.totalAktuelles}
        href="/dashboard/aktuelles"
        pathname={pathname}
      />
      <StatCard
        label={t("events")}
        value={stats.totalEvents}
        href="/dashboard/events"
        pathname={pathname}
      />
      <StatCard
        icon={<FaSlidersH size={18} />}
        label="Carruseles"
        href="/dashboard/carousels"
        pathname={pathname}
      />
      <StatCardDropdown
        icon={<FaLanguage size={18} />}
        label={t("translations")}
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
        pathname={pathname}
      />
      <StatCardDropdown
        icon={<FaShoppingCart size={18} />}
        label={t("orders")}
        items={[
          {
            label: t("viewOrders") || "Bestellungen",
            href: "/dashboard/orders",
          },
          { label: "Prämien", href: "/dashboard/orders/praemien" }, // 👈 nuestro nuevo dropdown
        ]}
        pathname={pathname}
      />
      <StatCard
        icon={<FaCog size={18} />}
        label={t("account")}
        href="/dashboard/account"
        pathname={pathname}
      />
      <StatCard
        icon={<FaQuestionCircle size={18} />}
        label=""
        value=""
        href="/dashboard/faq"
        pathname={pathname}
      />
    </div>
  );
};

// 🧩 Componente reutilizable
function StatCard({ label, value, color, icon, onClick, href, pathname }) {
  const isCompact = !label && !value;

  // Detectar si la ruta actual coincide con el href
  const isActive = pathname?.startsWith(href);

  const content = (
    <div
      onClick={onClick}
      className={`cursor-pointer flex-shrink-0 ${
        isCompact ? "w-10 h-10 justify-center" : "min-w-[110px] px-4 py-3"
      } bg-white rounded-md shadow-sm border-2 ${
        isActive
          ? "border-red-500 bg-red-50 dark:bg-red-900/20" // 🔴 Cambiado a rojo
          : "border-gray-200 hover:bg-gray-50"
      } flex items-center gap-2 text-sm transition-all`}
    >
      {icon && (
        <span className={isActive ? "font-bold text-red-600" : ""}>{icon}</span>
      )}
      {!isCompact && (
        <>
          <span
            className={`font-bold ${isActive ? "font-bold text-red-600" : ""} ${color}`}
          >
            {value}
          </span>
          <span
            className={`whitespace-nowrap ${isActive ? "font-bold text-red-600" : "text-gray-600"}`}
          >
            {label}
          </span>
        </>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function StatCardDropdown({ icon, label, color, items, pathname }) {
  const [open, setOpen] = useState(false);

  // Detectar si algún item del dropdown está activo
  const isActive = items.some((item) => pathname?.startsWith(item.href));

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Puente invisible para mantener hover */}
      <div className="absolute left-0 top-full w-full h-1 opacity-0 group-hover:opacity-100" />

      {/* Botón */}
      <div
        className={`cursor-pointer min-w-[140px] px-4 py-3 bg-white rounded-md shadow-sm border-2 ${
          isActive
            ? "border-red-500 bg-red-50 dark:bg-red-900/20" // 🔴 Cambiado a rojo
            : "border-gray-200 hover:bg-gray-50"
        } flex items-center gap-3 text-sm transition-all`}
      >
        {icon && <span className={isActive ? "text-red-600" : ""}>{icon}</span>}
        <span
          className={`${isActive ? "font-bold text-red-600" : "font-normal text-gray-900"} ${color}`}
        >
          {label}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-0 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-56">
          <ul className="py-2 text-sm text-gray-700">
            {items.map((item) => {
              const isItemActive = pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-2 ${
                      isItemActive
                        ? "bg-blue-100 text-blue-700 font-semibold"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DashboardStats;

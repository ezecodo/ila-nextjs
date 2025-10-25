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

  const [newOrders, setNewOrders] = useState(0);

  useEffect(() => {
    async function fetchOrdersCount() {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data = await res.json();
        setNewOrders(data.newOrdersCount || 0);
      } catch (err) {
        console.error("Error cargando contador de pedidos:", err);
      }
    }
    fetchOrdersCount();
  }, []);
  const [newSubscriptions, setNewSubscriptions] = useState(0);

  useEffect(() => {
    async function fetchSubscriptionsCount() {
      try {
        const res = await fetch("/api/subscriptions", { cache: "no-store" });
        const data = await res.json();
        setNewSubscriptions(data.newSubscriptionsCount || 0);
      } catch (err) {
        console.error("Error cargando contador de Abos:", err);
      }
    }
    fetchSubscriptionsCount();
  }, []);

  if (loading) return null;
  if (error) return <p className="text-center text-red-500">{t("error")}</p>;

  return (
    <div className="sticky top-0 z-[60] bg-white shadow-sm py-2 flex flex-wrap gap-2 items-center justify-start">
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
        icon={
          <div className="relative">
            <FaShoppingCart
              size={18}
              className={newOrders > 0 ? "text-red-600" : ""}
            />
          </div>
        }
        label={t("orders")}
        items={[
          {
            label: `${t("viewOrders")}${newOrders > 0 ? ` (${newOrders})` : ""}`,
            href: "/dashboard/orders",
          },
          {
            label: `Abos${newSubscriptions > 0 ? ` (${newSubscriptions})` : ""}`,
            href: "/dashboard/subscriptions",
          },
          { label: t("gifts"), href: "/dashboard/gifts" },
        ]}
        pathname={pathname}
        newOrders={newOrders}
        newSubscriptions={newSubscriptions}
        t={t}
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

export function StatCardDropdown({
  icon,
  label,
  color,
  items,
  pathname,
  newOrders = 0,
  newSubscriptions = 0,
  t,
}) {
  const [open, setOpen] = useState(false);

  // fallback de traducción
  const translate = t || ((key) => key);

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
        className={`relative cursor-pointer min-w-[140px] px-4 py-3 bg-white rounded-md shadow-sm border-2 ${
          isActive
            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
            : "border-gray-200 hover:bg-gray-50"
        } flex items-center gap-3 text-sm transition-all`}
      >
        {/* Icono */}
        {icon && <span className={isActive ? "text-red-600" : ""}>{icon}</span>}

        {/* Texto */}
        <span
          className={`${
            isActive ? "font-bold text-red-600" : "font-normal text-gray-900"
          } ${color}`}
        >
          {label}
        </span>

        {/* 🔴 Badge arriba a la derecha del botón */}
        {label === translate("orders") &&
          (newOrders > 0 || newSubscriptions > 0) && (
            <span
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-600 border-2 border-white rounded-full animate-pulse shadow-sm"
              title={`${newOrders} neue Bestellung${newOrders > 1 ? "en" : ""}`}
            />
          )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-56">
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

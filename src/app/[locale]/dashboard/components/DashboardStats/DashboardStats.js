"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import {
  FaFileAlt,
  FaRegNewspaper,
  FaShoppingCart,
  FaLanguage,
  FaSlidersH,
  FaCog,
  FaQuestionCircle,
  FaUsers,
} from "react-icons/fa";

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("stats");
  const fullPathname = usePathname();

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
    <div className="sticky top-0 z-[60] bg-white shadow-sm py-2 flex flex-nowrap gap-2 items-center justify-center">
      {/* Logo ila */}
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

      {/* Inhalte: Artículos + Dossiers */}
      <StatCardDropdown
        icon={<FaFileAlt size={18} />}
        label={t("contentLabel")}
        items={[
          {
            label: `${t("articles")} (${stats.totalArticles})`,
            href: "/dashboard/articles",
          },
          {
            label: `${t("editions")} (${stats.totalEditions})`,
            href: "/dashboard/editions",
          },
        ]}
        pathname={pathname}
      />

      {/* Aktuelles: Aktuelles + Events */}
      <StatCardDropdown
        icon={<FaRegNewspaper size={18} />}
        label={t("aktuellesLabel")}
        items={[
          {
            label: `${t("aktuellesItem")} (${stats.totalAktuelles})`,
            href: "/dashboard/aktuelles",
          },
          {
            label: `${t("events")} (${stats.totalEvents})`,
            href: "/dashboard/events",
          },
        ]}
        pathname={pathname}
      />

      {/* Übersetzungen */}
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

      {/* Bestellungen: Orders + Abos + Gifts */}
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

      {/* Gestaltung: Carruseles + Links */}
      <StatCardDropdown
        icon={<FaSlidersH size={18} />}
        label={t("gestaltungLabel")}
        items={[
          { label: t("carousels"), href: "/dashboard/carousels" },
          { label: t("links"), href: "/dashboard/links" },
        ]}
        pathname={pathname}
      />

      {/* Verwaltung: Annual Index + Autores + Network + Regiones + Topics */}
      <StatCardDropdown
        icon={<FaUsers size={18} />}
        label={t("auditLabel")}
        items={[
          { label: t("annualIndex"), href: "/dashboard/annual-index" },
          { label: t("authors"), href: "/dashboard/authors" },
          { label: t("network"), href: "/dashboard/network" },
          { label: t("regions"), href: "/dashboard/regions" },
          { label: t("topics"), href: "/dashboard/topics" },
        ]}
        pathname={pathname}
      />

      {/* Cuenta */}
      <StatCard
        icon={<FaCog size={18} />}
        label=""
        value=""
        href="/dashboard/account"
        pathname={pathname}
      />

      {/* FAQ */}
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
  const isActive = pathname?.startsWith(href);

  const content = (
    <div
      onClick={onClick}
      className={`cursor-pointer flex-shrink-0 ${
        isCompact ? "w-10 h-10 justify-center" : "min-w-[90px] px-3 py-2"
      } bg-white rounded-md shadow-sm border-2 ${
        isActive
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : "border-gray-200 hover:bg-gray-50"
      } flex items-center gap-2 text-sm transition-all whitespace-nowrap`}
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
  const translate = t || ((key) => key);
  const isActive = items.some((item) => pathname?.startsWith(item.href));

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Botón */}
      <div
        className={`relative cursor-pointer min-w-[115px] px-3 py-2 bg-white rounded-md shadow-sm border-2 ${
          isActive
            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
            : "border-gray-200 hover:bg-gray-50"
        } flex items-center gap-2 text-sm transition-all whitespace-nowrap`}
      >
        {icon && <span className={isActive ? "text-red-600" : ""}>{icon}</span>}
        <span
          className={`${
            isActive ? "font-bold text-red-600" : "font-normal text-gray-900"
          } ${color}`}
        >
          {label}
        </span>

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
        <div className="absolute left-0 top-full pt-1 bg-transparent">
          <div className="bg-white border border-gray-200 rounded-md shadow-lg z-[9999] min-w-[200px]">
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
        </div>
      )}
    </div>
  );
}

export default DashboardStats;

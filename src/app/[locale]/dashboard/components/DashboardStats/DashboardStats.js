"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";

// El "Cuarto" (laboratorio de experimentos) es privado: solo este email lo ve.
const SUPER_ADMIN_EMAIL = "e.zeangeloni@gmail.com";

import {
  FaFileAlt,
  FaShoppingCart,
  FaLanguage,
  FaSlidersH,
  FaCog,
  FaQuestionCircle,
  FaUsers,
  FaBars,
  FaTimes,
  FaChartLine,
  FaClipboardList,
  FaBookOpen,
  FaGlobeAmericas,
  FaDoorOpen,
  FaShieldAlt,
} from "react-icons/fa";

const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("stats");
  const fullPathname = usePathname();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.email === SUPER_ADMIN_EMAIL;

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

  const [newReviews, setNewReviews] = useState(0);

  useEffect(() => {
    async function fetchReviewCount() {
      try {
        const res = await fetch("/api/articles/review-count", {
          cache: "no-store",
        });
        const data = await res.json();
        setNewReviews(data.reviewCount || 0);
      } catch (err) {
        console.error("Error cargando contador de revisiones:", err);
      }
    }
    fetchReviewCount();
  }, []);

  if (loading) return null;
  if (error) return <p className="text-center text-red-500">{t("error")}</p>;

  const mobileLinkClass = (href) =>
    `block px-4 py-2.5 text-sm ${
      pathname?.startsWith(href)
        ? "bg-red-50 text-red-700 font-semibold"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <div className="sticky top-0 z-[60] bg-white shadow-sm">
      {/* ── Desktop nav ─────────────────────────────────────── */}
      <div className="hidden md:flex flex-wrap gap-2 items-center justify-center py-2 px-2">
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

        {/* Inhalte (incluye Aktuelles/Events, fusionados acá para ahorrar
            un botón entero en la fila — antes era un dropdown aparte) */}
        <StatCardDropdown
          icon={<FaFileAlt size={18} />}
          label={t("contentLabel")}
          items={[
            { heading: t("contentLabel") },
            {
              label: `${t("articles")} (${stats.totalArticles})`,
              href: "/dashboard/articles",
            },
            {
              label: `${t("editions")} (${stats.totalEditions})`,
              href: "/dashboard/editions",
            },
            { heading: t("aktuellesLabel") },
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
              label: `${t("reviewTranslations")}${newReviews > 0 ? ` (${newReviews})` : ""}`,
              href: "/dashboard/reviewer/review",
            },
            {
              label: t("manageTranslators"),
              href: "/dashboard/admin/translators",
            },
            {
              label: t("myAssignments"),
              href: "/dashboard/translators/assignments",
            },
          ]}
          pathname={pathname}
          badgeCount={newReviews}
          badgeTitle={`${newReviews} Artikel zur Überprüfung`}
        />

        {/* Gestaltung */}
        <StatCardDropdown
          icon={<FaSlidersH size={18} />}
          label={t("gestaltungLabel")}
          items={[
            { label: t("carousels"), href: "/dashboard/carousels" },
            { label: t("links"), href: "/dashboard/links" },
          ]}
          pathname={pathname}
        />

        {/* Verwaltung */}
        <StatCardDropdown
          icon={<FaUsers size={18} />}
          label={t("auditLabel")}
          items={[
            { label: t("annualIndex"), href: "/dashboard/annual-index" },
            { label: t("authors"), href: "/dashboard/authors" },
            { label: t("network"), href: "/dashboard/network" },
            { label: t("redaktionTeam"), href: "/dashboard/redaktion-team" },
            { label: t("regions"), href: "/dashboard/regions" },
            { label: t("topics"), href: "/dashboard/topics" },
            { label: t("dossiersPdf"), href: "/dashboard/admin/dossiers-pdf" },
          ]}
          pathname={pathname}
        />

        {/* Bestellungen — solo ícono (carrito), como Cuenta/Redaktion/
            Analytics/FAQ en esta misma fila; el label vive en el `title` */}
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
          iconOnly
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
            { label: t("pdfAbo"), href: "/dashboard/admin/pdf-abo" },
          ]}
          pathname={pathname}
          badgeCount={newOrders + newSubscriptions}
          badgeTitle={`${newOrders} neue Bestellung${newOrders !== 1 ? "en" : ""}`}
        />

        {/* Cuenta */}
        <StatCard
          icon={<FaCog size={18} />}
          label=""
          value=""
          href="/dashboard/account"
          pathname={pathname}
        />

        {/* Redaktion — ícono de checklist (no de gráfico) para no
            confundirse con Analytics: mide avance de producción, no
            tráfico */}
        <StatCard
          icon={<FaClipboardList size={18} />}
          label=""
          value=""
          href="/dashboard/redaktion"
          pathname={pathname}
          tooltip={
            <>
              <span className="block font-bold text-white">
                {t("redaktion")}
              </span>
              <span className="mt-1 block">{t("redaktionTooltip")}</span>
            </>
          }
        />

        {/* Analytics */}
        <StatCard
          icon={<FaChartLine size={18} />}
          label=""
          value=""
          href="/dashboard/analytics"
          pathname={pathname}
          tooltip={
            <>
              <span className="block font-bold text-white">
                {t("analytics")}
              </span>
              <span className="mt-1 block">{t("analyticsTooltip")}</span>
            </>
          }
        />

        {/* Mein DIGIabo (vista de suscriptor) */}
        <Link href="/dashboard-users" className="group relative flex-shrink-0">
          <div
            className={`relative flex items-center gap-1.5 rounded-md border-2 bg-white px-3 py-2 transition-all whitespace-nowrap shadow-[0_0_16px_3px_rgba(34,211,238,0.8)] ${
              pathname?.startsWith("/dashboard-users")
                ? "border-cyan-400 bg-cyan-50"
                : "border-cyan-400 hover:bg-cyan-50"
            }`}
          >
            {/* Anillo cyan pulsante (nuevo feature) */}
            <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-cyan-400 animate-pulse" />

            <FaBookOpen size={16} className="text-cyan-500" />
            <span
              className="text-lg font-extrabold leading-none tracking-tight"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              <span className="text-gray-900">DIGI</span>
              <span className="text-[#BD0E0D]">abo</span>
            </span>

            {/* Tooltip */}
            <span className="pointer-events-none absolute top-full right-0 z-[9999] mt-2 block w-64 max-w-[80vw] whitespace-normal break-words rounded-none bg-gray-900 px-3.5 py-2.5 text-xs font-normal leading-snug text-white text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
              <span className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-gray-900" />
              {t("digitalAboTooltip")}
              <span className="mt-1.5 block italic text-white/80">
                {t("digitalAboTooltipSignoff")}
              </span>
            </span>
          </div>
        </Link>

        {/* GLOBila (nuevo feature) */}
        <Link href="/map" className="group relative flex-shrink-0">
          <div
            className={`relative flex items-center gap-1.5 rounded-md border-2 bg-white px-3 py-2 transition-all whitespace-nowrap shadow-[0_0_16px_3px_rgba(34,211,238,0.8)] ${
              pathname?.startsWith("/map")
                ? "border-cyan-400 bg-cyan-50"
                : "border-cyan-400 hover:bg-cyan-50"
            }`}
          >
            {/* Anillo cyan pulsante (nuevo feature) */}
            <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-cyan-400 animate-pulse" />

            <FaGlobeAmericas size={16} className="text-cyan-500" />
            <span
              className="text-lg font-extrabold leading-none tracking-tight"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              <span className="text-gray-900">GLOB</span>
              <span className="text-[#BD0E0D]">ila</span>
            </span>

            {/* Tooltip */}
            <span className="pointer-events-none absolute top-full right-0 z-[9999] mt-2 block w-64 max-w-[80vw] whitespace-normal break-words rounded-none bg-gray-900 px-3.5 py-2.5 text-xs font-normal leading-snug text-white text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
              <span className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-gray-900" />
              <span className="block font-bold text-cyan-300">GLOBila</span>
              <span className="mt-1 block">{t("mapTooltip")}</span>
            </span>
          </div>
        </Link>

        {/* VACAPila (backups) */}
        <Link
          href="/dashboard/admin/backups"
          className="group relative flex-shrink-0"
        >
          <div
            className={`relative flex items-center gap-1.5 rounded-md border-2 bg-white px-3 py-2 transition-all whitespace-nowrap shadow-[0_0_16px_3px_rgba(34,211,238,0.8)] ${
              pathname?.startsWith("/dashboard/admin/backups")
                ? "border-cyan-400 bg-cyan-50"
                : "border-cyan-400 hover:bg-cyan-50"
            }`}
          >
            {/* Anillo cyan pulsante (nuevo feature) */}
            <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-cyan-400 animate-pulse" />

            <FaShieldAlt size={16} className="text-cyan-500" />
            <span
              className="text-lg font-extrabold leading-none tracking-tight"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              <span className="text-gray-900">VACAP</span>
              <span className="text-[#BD0E0D]">ila</span>
            </span>

            {/* Tooltip */}
            <span className="pointer-events-none absolute top-full right-0 z-[9999] mt-2 block w-64 max-w-[80vw] whitespace-normal break-words rounded-none bg-gray-900 px-3.5 py-2.5 text-xs font-normal leading-snug text-white text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
              <span className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-gray-900" />
              <span className="block font-bold text-cyan-300">VACAPila</span>
              <span className="mt-1 block">{t("backupsTooltip")}</span>
            </span>
          </div>
        </Link>

        {/* Cuarto (experimentos) — privado, solo super admin */}
        {isSuperAdmin && (
          <StatCard
            icon={<FaDoorOpen size={18} />}
            label={t("cuarto")}
            value=""
            href="/dashboard/cuarto"
            pathname={pathname}
          />
        )}

        {/* FAQ */}
        <StatCard
          icon={<FaQuestionCircle size={18} />}
          label=""
          value=""
          href="/dashboard/faq"
          pathname={pathname}
        />
      </div>

      {/* ── Mobile header ─────────────────────────────────────── */}
      <div className="flex md:hidden items-center justify-between px-4 py-2">
        <Link
          href="/dashboard/activity"
          className="font-bold text-xl"
          style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
        >
          ila
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* ── Mobile dropdown menu ──────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
          <nav className="pb-4">
            {/* Inicio */}
            <Link
              href="/dashboard/activity"
              className={mobileLinkClass("/dashboard/activity")}
              onClick={closeMobile}
            >
              Inicio
            </Link>

            {/* Inhalte */}
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t("contentLabel")}
            </div>
            <Link
              href="/dashboard/articles"
              className={mobileLinkClass("/dashboard/articles")}
              onClick={closeMobile}
            >
              {t("articles")} ({stats.totalArticles})
            </Link>
            <Link
              href="/dashboard/editions"
              className={mobileLinkClass("/dashboard/editions")}
              onClick={closeMobile}
            >
              {t("editions")} ({stats.totalEditions})
            </Link>

            {/* Aktuelles */}
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t("aktuellesLabel")}
            </div>
            <Link
              href="/dashboard/aktuelles"
              className={mobileLinkClass("/dashboard/aktuelles")}
              onClick={closeMobile}
            >
              {t("aktuellesItem")} ({stats.totalAktuelles})
            </Link>
            <Link
              href="/dashboard/events"
              className={mobileLinkClass("/dashboard/events")}
              onClick={closeMobile}
            >
              {t("events")} ({stats.totalEvents})
            </Link>

            {/* Übersetzungen */}
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t("translations")}
            </div>
            <Link
              href="/dashboard/reviewer/assign"
              className={mobileLinkClass("/dashboard/reviewer/assign")}
              onClick={closeMobile}
            >
              {t("assignTranslations")}
            </Link>
            <Link
              href="/dashboard/reviewer/review"
              className={mobileLinkClass("/dashboard/reviewer/review")}
              onClick={closeMobile}
            >
              {t("reviewTranslations")}
              {newReviews > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-green-600 text-white rounded-full">
                  {newReviews}
                </span>
              )}
            </Link>

            {/* Gestaltung */}
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t("gestaltungLabel")}
            </div>
            <Link
              href="/dashboard/carousels"
              className={mobileLinkClass("/dashboard/carousels")}
              onClick={closeMobile}
            >
              {t("carousels")}
            </Link>
            <Link
              href="/dashboard/links"
              className={mobileLinkClass("/dashboard/links")}
              onClick={closeMobile}
            >
              {t("links")}
            </Link>

            {/* Verwaltung */}
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t("auditLabel")}
            </div>
            <Link
              href="/dashboard/annual-index"
              className={mobileLinkClass("/dashboard/annual-index")}
              onClick={closeMobile}
            >
              {t("annualIndex")}
            </Link>
            <Link
              href="/dashboard/authors"
              className={mobileLinkClass("/dashboard/authors")}
              onClick={closeMobile}
            >
              {t("authors")}
            </Link>
            <Link
              href="/dashboard/network"
              className={mobileLinkClass("/dashboard/network")}
              onClick={closeMobile}
            >
              {t("network")}
            </Link>
            <Link
              href="/dashboard/redaktion-team"
              className={mobileLinkClass("/dashboard/redaktion-team")}
              onClick={closeMobile}
            >
              {t("redaktionTeam")}
            </Link>
            <Link
              href="/dashboard/regions"
              className={mobileLinkClass("/dashboard/regions")}
              onClick={closeMobile}
            >
              {t("regions")}
            </Link>
            <Link
              href="/dashboard/topics"
              className={mobileLinkClass("/dashboard/topics")}
              onClick={closeMobile}
            >
              {t("topics")}
            </Link>
            <Link
              href="/dashboard/admin/dossiers-pdf"
              className={mobileLinkClass("/dashboard/admin/dossiers-pdf")}
              onClick={closeMobile}
            >
              {t("dossiersPdf")}
            </Link>

            {/* Bestellungen */}
            <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {t("orders")}
            </div>
            <Link
              href="/dashboard/orders"
              className={mobileLinkClass("/dashboard/orders")}
              onClick={closeMobile}
            >
              {t("viewOrders")}
              {newOrders > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-red-600 text-white rounded-full">
                  {newOrders}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/subscriptions"
              className={mobileLinkClass("/dashboard/subscriptions")}
              onClick={closeMobile}
            >
              Abos
              {newSubscriptions > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-green-600 text-white rounded-full">
                  {newSubscriptions}
                </span>
              )}
            </Link>
            <Link
              href="/dashboard/gifts"
              className={mobileLinkClass("/dashboard/gifts")}
              onClick={closeMobile}
            >
              {t("gifts")}
            </Link>
            <Link
              href="/dashboard/admin/pdf-abo"
              className={mobileLinkClass("/dashboard/admin/pdf-abo")}
              onClick={closeMobile}
            >
              {t("pdfAbo")}
            </Link>

            {/* Cuenta / FAQ / Analytics */}
            <div className="border-t border-gray-100 mt-2 pt-2">
              <Link
                href="/dashboard-users"
                className={mobileLinkClass("/dashboard-users")}
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <FaBookOpen size={14} /> {t("digitalAbo")}
                </span>
              </Link>
              <Link
                href="/dashboard/redaktion"
                className={mobileLinkClass("/dashboard/redaktion")}
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <FaClipboardList size={14} /> {t("redaktion")}
                </span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={mobileLinkClass("/dashboard/analytics")}
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <FaChartLine size={14} /> {t("analytics")}
                </span>
              </Link>
              <Link
                href="/dashboard/account"
                className={mobileLinkClass("/dashboard/account")}
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <FaCog size={14} /> Account
                </span>
              </Link>
              <Link
                href="/map"
                className={mobileLinkClass("/map")}
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <FaGlobeAmericas size={14} className="text-cyan-500" />
                  <span
                    className="font-extrabold tracking-tight"
                    style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
                  >
                    <span className="text-gray-900">GLOB</span>
                    <span className="text-[#BD0E0D]">ila</span>
                  </span>
                  <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-cyan-700">
                    Beta
                  </span>
                </span>
              </Link>
              <Link
                href="/dashboard/admin/backups"
                className={mobileLinkClass("/dashboard/admin/backups")}
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <FaShieldAlt size={14} className="text-cyan-500" />
                  <span
                    className="font-extrabold tracking-tight"
                    style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
                  >
                    <span className="text-gray-900">VACAP</span>
                    <span className="text-[#BD0E0D]">ila</span>
                  </span>
                </span>
              </Link>
              {isSuperAdmin && (
                <Link
                  href="/dashboard/cuarto"
                  className={mobileLinkClass("/dashboard/cuarto")}
                  onClick={closeMobile}
                >
                  <span className="flex items-center gap-2">
                    <FaDoorOpen size={14} /> {t("cuarto")}
                  </span>
                </Link>
              )}
              <Link
                href="/dashboard/faq"
                className={mobileLinkClass("/dashboard/faq")}
                onClick={closeMobile}
              >
                <span className="flex items-center gap-2">
                  <FaQuestionCircle size={14} /> FAQ
                </span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
};

// 🧩 Componente reutilizable
function StatCard({
  label,
  value,
  color,
  icon,
  onClick,
  href,
  pathname,
  tooltip,
  tooltipSignoff,
}) {
  const isCompact = !label && !value;
  const isActive = pathname?.startsWith(href);

  const content = (
    <div
      onClick={onClick}
      className={`group relative cursor-pointer flex-shrink-0 ${
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

      {tooltip && (
        <span className="pointer-events-none absolute top-full right-0 z-[9999] mt-2 block w-64 max-w-[80vw] whitespace-normal break-words rounded-none bg-gray-900 px-3.5 py-2.5 text-xs font-normal leading-snug text-white text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
          <span className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-gray-900" />
          {tooltip}
          {tooltipSignoff && (
            <span className="mt-1.5 block italic text-white/80">
              {tooltipSignoff}
            </span>
          )}
        </span>
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
  badgeCount = 0,
  badgeTitle,
  iconOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const isActive = items.some((item) => pathname?.startsWith(item.href));

  return (
    <div
      className="relative flex-shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(!open)}
    >
      {/* Botón. iconOnly: sin label ni min-width fijo — solo el ícono, con
          `title` nativo como reemplazo accesible del texto que se esconde. */}
      <div
        title={iconOnly ? label : undefined}
        className={`relative cursor-pointer ${iconOnly ? "px-3 py-2" : "min-w-[115px] px-3 py-2"} bg-white rounded-md shadow-sm border-2 ${
          isActive
            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
            : "border-gray-200 hover:bg-gray-50"
        } flex items-center gap-2 text-sm transition-all whitespace-nowrap`}
      >
        {icon && <span className={isActive ? "text-red-600" : ""}>{icon}</span>}
        {!iconOnly && (
          <span
            className={`${
              isActive ? "font-bold text-red-600" : "font-normal text-gray-900"
            } ${color}`}
          >
            {label}
          </span>
        )}

        {badgeCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-600 border-2 border-white rounded-full animate-pulse shadow-sm"
            title={badgeTitle}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full pt-1 bg-transparent">
          <div className="bg-white border border-gray-200 rounded-md shadow-lg z-[9999] min-w-[200px]">
            <ul className="py-2 text-sm text-gray-700">
              {items.map((item, idx) => {
                // Encabezado de sección no-clickeable, para agrupar ítems
                // dentro de un mismo dropdown sin agregar un submenú/flyout
                // (más interacción de la que amerita un puñado de ítems).
                if (item.heading) {
                  return (
                    <li
                      key={`heading-${item.heading}`}
                      className={`px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${
                        idx === 0 ? "pt-1" : "mt-1 pt-2 border-t border-gray-100"
                      }`}
                    >
                      {item.heading}
                    </li>
                  );
                }
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

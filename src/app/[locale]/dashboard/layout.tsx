"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import DashboardStats from "../dashboard/components/DashboardStats/DashboardStats";
import {
  FaHome,
  FaFileAlt,
  FaUserCog,
  FaBookOpen,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Sidebar colapsado a solo iconos (solo aplica en desktop).
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const locale = useLocale();
  const isDashboard = pathname?.startsWith("/dashboard");
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role || "user";

  // Señal de asignaciones nuevas (sin abrir) para el traductor.
  const [newAssignments, setNewAssignments] = useState(0);
  useEffect(() => {
    if (role !== "translator") return;
    let active = true;
    fetch("/api/articles/assignments-count")
      .then((r) => r.json())
      .then((d) => {
        if (active) setNewAssignments(d?.newCount || 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [role]);

  // ── Menús por rol ─────────────────────────────────────────────────────
  const adminMenu = [
    {
      key: "inicio",
      label: t("menu.inicio"),
      href: "/dashboard",
      icon: <FaHome />,
    },
  ];

  const translatorMenu = [
    {
      key: "inicio",
      label: t("menu.inicio"),
      href: "/dashboard/translators",
      icon: <FaHome />,
    },
    {
      key: "assignments",
      label: "Mis Asignaciones",
      href: "/dashboard/translators/assignments",
      icon: <FaFileAlt />,
    },
    {
      key: "account",
      label: t("menu.account"),
      href: "/dashboard/account",
      icon: <FaUserCog />,
    },
  ];

  // 🔥 NEW: menú para rol k2 (ingresar, editar, traducir)
  const k2Menu = [
    {
      key: "inicio",
      label: t("menu.inicio"),
      href: "/dashboard/k2",
      icon: <FaHome />,
    },
    {
      key: "articles",
      label: t("menu.articles"), // ✅ ahora usa traducciones
      href: "/dashboard/articles/new",
      icon: <FaFileAlt />,
    },
    {
      key: "editArticles",
      label: t("menu.editArticles"), // ✅ también traducido
      href: "/dashboard/articles",
      icon: <FaFileAlt />,
    },
    {
      key: "account",
      label: t("menu.account"),
      href: "/dashboard/account",
      icon: <FaUserCog />,
    },
  ];

  const userMenu = [
    {
      key: "inicio",
      label: t("menu.inicio"),
      href: "/dashboard",
      icon: <FaHome />,
    },
    {
      key: "account",
      label: t("menu.account"),
      href: "/dashboard/account",
      icon: <FaUserCog />,
    },
  ];

  const menuItems =
    role === "admin"
      ? adminMenu
      : role === "translator"
        ? translatorMenu
        : role === "k2"
          ? k2Menu
          : userMenu;

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Stats solo admin */}
      {role === "admin" && (
        <div className="bg-white border-b shadow py-2 relative z-40">
          <DashboardStats />
        </div>
      )}

      {/* Menú móvil → solo si NO es admin */}
      {role !== "admin" && (
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden bg-blue-500 text-white p-3 text-center w-full"
          suppressHydrationWarning
        >
          {menuOpen ? t("closeMenu") : t("openMenu")}
        </button>
      )}

      <div className="flex flex-1 overflow-hidden min-w-0 bg-gray-50">
        {/* Sidebar → solo si NO es admin */}
        {role !== "admin" && (
          <aside
            className={`w-full bg-white shadow-md px-3 py-6 md:block ${
              collapsed ? "md:w-16" : "md:w-44 xl:w-48"
            } ${menuOpen ? "block" : "hidden"}`}
          >
            <div className="mb-6 flex items-center justify-between gap-2">
              <h2
                className={`text-xl font-semibold ${collapsed ? "md:hidden" : ""}`}
              >
                {role === "translator"
                  ? "Traducción Dashboard"
                  : role === "k2"
                    ? "K2 Dashboard"
                    : "User Dashboard"}
              </h2>
              {/* Botón colapsar (solo desktop) */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                title={collapsed ? "Expandir menú" : "Colapsar menú"}
              >
                {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
              </button>
            </div>

            <ul>
              {menuItems.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname === fullHref;

                return (
                  <li key={item.key}>
                    <Link
                      href={fullHref}
                      title={item.label}
                      className={`relative flex items-center gap-2 p-2 rounded-md mb-2 text-sm transition ${
                        collapsed ? "md:justify-center" : ""
                      } ${
                        isActive
                          ? "bg-red-100 text-red-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className={collapsed ? "md:hidden" : ""}>
                        {item.label}
                      </span>
                      {item.key === "assignments" && newAssignments > 0 && (
                        <span
                          className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#BD0E0D] px-1.5 text-xs font-bold text-white ${
                            collapsed
                              ? "md:absolute md:right-1 md:top-1 md:h-4 md:min-w-[1rem] md:px-1 md:text-[10px]"
                              : "ml-auto"
                          }`}
                        >
                          {newAssignments}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* DIGIabo: acceso a los beneficios de suscriptor (solo traductores) */}
            {role === "translator" &&
              (() => {
                const digiHref = `/${locale}/dashboard/translators/digital-abo`;
                const digiActive = pathname === digiHref;
                return (
                  <Link
                    href={digiHref}
                    title="DIGIabo"
                    className={`group relative mt-4 flex items-center gap-1.5 rounded-md border-2 bg-white px-3 py-2 transition-all whitespace-nowrap shadow-[0_0_16px_3px_rgba(34,211,238,0.8)] ${
                      collapsed ? "md:justify-center md:px-2" : ""
                    } ${
                      digiActive
                        ? "border-cyan-400 bg-cyan-50"
                        : "border-cyan-400 hover:bg-cyan-50"
                    }`}
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-cyan-400 animate-pulse" />
                    <FaBookOpen size={16} className="text-cyan-500" />
                    <span
                      className={`text-lg font-extrabold leading-none tracking-tight ${
                        collapsed ? "md:hidden" : ""
                      }`}
                      style={{
                        fontFamily: "Futura Cyrillic, Arial, sans-serif",
                      }}
                    >
                      <span className="text-gray-900">DIGI</span>
                      <span className="text-[#BD0E0D]">abo</span>
                    </span>
                  </Link>
                );
              })()}
          </aside>
        )}

        {/* Contenido principal */}
        <main
          className={`flex-1 py-4 overflow-y-auto max-h-screen min-w-0 ${
            isDashboard ? "px-0" : "px-6"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

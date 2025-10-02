"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import DashboardStats from "../dashboard/components/DashboardStats/DashboardStats";
import { FaHome, FaFileAlt, FaUserCog } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const locale = useLocale();
  const isDashboard = pathname?.startsWith("/dashboard");
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role || "user";

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
        <div className="bg-white border-b shadow py-2">
          <DashboardStats />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden min-w-0 bg-gray-50">
        {/* Menú móvil */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden bg-blue-500 text-white p-3 text-center w-full"
          suppressHydrationWarning
        >
          {menuOpen ? t("closeMenu") : t("openMenu")}
        </button>

        {/* Sidebar → solo si NO es admin */}
        {role !== "admin" && (
          <aside
            className={`w-full md:w-52 xl:w-64 bg-white shadow-md px-4 py-6 md:block ${
              menuOpen ? "block" : "hidden"
            }`}
          >
            <h2 className="text-xl font-semibold mb-6">
              {role === "translator"
                ? "Traducción Dashboard"
                : role === "k2"
                  ? "K2 Dashboard"
                  : "User Dashboard"}
            </h2>

            <ul>
              {menuItems.map((item) => {
                const fullHref = `/${locale}${item.href}`;
                const isActive = pathname === fullHref;

                return (
                  <li key={item.key}>
                    <Link
                      href={fullHref}
                      className={`flex items-center gap-2 p-2 rounded-md mb-2 text-sm transition ${
                        isActive
                          ? "bg-red-100 text-red-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import DashboardStats from "../dashboard/components/DashboardStats/DashboardStats";
import {
  FaHome,
  FaFileAlt,
  FaBook,
  FaUserCog,
  FaCalendarAlt,
  FaSlidersH,
} from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

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

  const menuItems = [
    {
      key: "inicio",
      label: t("menu.inicio"),
      href: "/dashboard",
      icon: <FaHome />,
    },
    {
      key: "articles",
      label: t("menu.articles"),
      href: "/dashboard/articles/new",
      icon: <FaFileAlt />,
    },
    {
      key: "editions",
      label: t("menu.editions"),
      href: "/dashboard/editions/new",
      icon: <FaBook />,
    },

    {
      key: "events",
      label: t("menu.events"),
      href: "/dashboard/events",
      icon: <FaCalendarAlt />,
    },
    {
      key: "carousels",
      label: "Carruseles",
      href: "/dashboard/carousels",
      icon: <FaSlidersH />,
    },
    {
      key: "account",
      label: t("menu.account"),
      href: "/dashboard/account",
      icon: <FaUserCog />,
    },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Barra superior de estadísticas */}
      <div className="bg-white border-b shadow py-2">
        <DashboardStats />
      </div>

      {/* Estructura principal */}
      <div className="flex flex-1 overflow-hidden min-w-0 bg-gray-50">
        {/* Menú móvil */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden bg-blue-500 text-white p-3 text-center w-full"
        >
          {menuOpen ? t("closeMenu") : t("openMenu")}
        </button>

        {/* Sidebar */}
        <aside
          className={`w-full md:w-52 xl:w-64 bg-white shadow-md px-4 py-6 md:block ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <h2 className="text-xl font-semibold mb-6">{t("title")}</h2>
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

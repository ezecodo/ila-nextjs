"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import DashboardStats from "../dashboard/components/DashboardStats/DashboardStats";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("dashboard");

  const menuItems = [
    { key: "inicio", label: t("menu.inicio"), href: "/dashboard" },
    {
      key: "articles",
      label: t("menu.articles"),
      href: "/dashboard/articles/new",
    },
    {
      key: "editions",
      label: t("menu.editions"),
      href: "/dashboard/editions/new",
    },
    { key: "account", label: t("menu.account"), href: "/dashboard/account" },
    { key: "events", label: t("menu.events"), href: "/dashboard/events" },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Barra superior de estadísticas */}
      <div className="bg-white border-b shadow px-4 py-2">
        <DashboardStats />
      </div>

      {/* Estructura principal */}
      <div className="flex flex-1 overflow-hidden md:flex-row min-w-0">
        {/* Menú móvil */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden bg-blue-500 text-white p-3 text-center w-full"
        >
          {menuOpen ? t("closeMenu") : t("openMenu")}
        </button>

        {/* Sidebar */}
        <aside
          className={`w-full md:w-36 bg-white shadow-md p-4 md:block ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <h2 className="text-xl font-semibold mb-5">{t("title")}</h2>
          <ul>
            {menuItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="block p-2 rounded-md mb-2 hover:bg-gray-200 text-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 p-6 overflow-y-auto max-h-screen min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

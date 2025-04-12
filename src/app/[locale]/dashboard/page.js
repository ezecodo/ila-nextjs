"use client";

import { useState, useEffect } from "react";
import DashboardStats from "../dashboard/components/DashboardStats/DashboardStats";
import AccountSettings from "../components/AccountSettings/AccountSettings.js";
import CreateArticle from "../dashboard/articles/new/page.js";

import CreateEdition from "../dashboard/editions/new/page.js";
import ArticlesList from "../dashboard/components/ArticlesList/ArticlesList.js";
import CreateEventPage from "./events/page.js";
import AdminEventsList from "../dashboard/components/AdminEventsList/AdminEventsList.js";
import { useTranslations } from "next-intl";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("inicio");
  const [showArticlesList, setShowArticlesList] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);
  const [stats, setStats] = useState(null); // ✅ Estado de estadísticas
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const t = useTranslations("dashboard");

  // ✅ Función que se ejecuta al eliminar un evento
  const handleItemDeleted = async () => {
    await fetchStats(); // recarga las stats actualizadas
    setRefreshKey((prev) => prev + 1); // fuerza el re-render
  };

  // ✅ Cargar estadísticas
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(t("errorStats"), err);
    }
  };

  useEffect(() => {
    fetchStats(); // ✅ Al cargar
  }, []);

  const handleShowArticles = () => {
    setShowEventsList(false);
    setShowArticlesList(!showArticlesList);
  };

  const handleShowEvents = () => {
    setShowArticlesList(false);
    setShowEventsList(!showEventsList);
  };

  const menuItems = [
    { key: "inicio", label: t("menu.inicio") },
    { key: "articles", label: t("menu.articles") },
    { key: "editions", label: t("menu.editions") },
    { key: "account", label: t("menu.account") },
    { key: "events", label: t("menu.events") },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-100">
      {/* ☰ Botón de menú en móviles */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden bg-blue-500 text-white p-3 text-center w-full"
      >
        {menuOpen ? t("closeMenu") : t("openMenu")}
      </button>

      {/* 📌 Sidebar */}
      <div
        className={`w-full md:w-1/5 bg-white shadow-md p-6 md:block ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <h2 className="text-2xl font-bold mb-6">{t("title")}</h2>
        <ul>
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => {
                  setSelectedTab(item.key);
                  setMenuOpen(false);
                }}
                className={`w-full text-left p-3 rounded-md mb-2 ${
                  selectedTab === item.key
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 📌 Contenido dinámico */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-screen">
        {selectedTab === "inicio" && (
          <>
            <DashboardStats
              key={refreshKey}
              stats={stats}
              onShowArticles={handleShowArticles}
              onShowEvents={handleShowEvents}
            />
            {showArticlesList && <ArticlesList />}
            {showEventsList && (
              <AdminEventsList onItemDeleted={handleItemDeleted} />
            )}
          </>
        )}
        {selectedTab === "articles" && <CreateArticle />}
        {selectedTab === "editions" && <CreateEdition />}
        {selectedTab === "account" && <AccountSettings />}
        {selectedTab === "events" && <CreateEventPage />}
      </div>
    </div>
  );
}

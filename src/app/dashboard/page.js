"use client";

import { useState } from "react";
import DashboardStats from "../dashboard/components/DashboardStats/DashboardStats";
import AccountSettings from "@/components/AccountSettings/AccountSettings";
import CreateArticle from "@/app/dashboard/articles/new/page";
import CreateEdition from "@/app/dashboard/editions/new/page";
import ArticlesList from "../../app/dashboard/components/ArticlesList/ArticlesList.js";
import CreateEventPage from "./events/page.js";
import AdminEventsList from "../dashboard/components/AdminEventsList/AdminEventsList.js";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("inicio");
  const [showArticlesList, setShowArticlesList] = useState(false);
  const [showEventsList, setShowEventsList] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false); // 🔥 Estado para colapsar menú en móviles

  const handleShowArticles = () => {
    setShowEventsList(false); // 🔥 oculta eventos
    setShowArticlesList(!showArticlesList); // toggle de artículos
  };
  const handleShowEvents = () => {
    setShowArticlesList(false); // 🔥 oculta artículos
    setShowEventsList(!showEventsList); // toggle de eventos
  };

  // Opciones del menú
  const menuItems = [
    { key: "inicio", label: "Inicio" },
    { key: "articles", label: "Ingresar Artículo" },
    { key: "editions", label: "Ingresar Edición" },
    { key: "account", label: "Configuración de Cuenta" },
    { key: "events", label: "Crear Eventos" },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-100">
      {/* 📌 Botón de menú en móviles */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden bg-blue-500 text-white p-3 text-center w-full"
      >
        {menuOpen ? "Cerrar Menú ☰" : "Abrir Menú ☰"}
      </button>

      {/* 📌 Sidebar - Menú de navegación */}
      <div
        className={`w-full md:w-1/5 bg-white shadow-md p-6 md:block ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <h2 className="text-2xl font-bold mb-6">Dashboard Admin</h2>
        <ul>
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => {
                  setSelectedTab(item.key);
                  setMenuOpen(false); // 🔥 Cierra el menú al hacer clic en móviles
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

      {/* 📌 Área de contenido dinámico con scroll interno */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-screen">
        {selectedTab === "inicio" && (
          <>
            <DashboardStats
              onShowArticles={handleShowArticles}
              onShowEvents={handleShowEvents}
            />
            {showArticlesList && <ArticlesList />}
            {showEventsList && <AdminEventsList />}
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

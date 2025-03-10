"use client";

import { useState } from "react";
import DashboardStats from "../../components/DashboardStats/DashboardStats.js";
import AccountSettings from "@/components/AccountSettings/AccountSettings";
import CreateArticle from "@/app/dashboard/articles/new/page";
import CreateEdition from "@/app/dashboard/editions/new/page";
import ArticlesList from "../../app/dashboard/components/ArticlesList/ArticlesList.js";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("inicio");
  const [showArticlesList, setShowArticlesList] = useState(false);

  const handleShowArticles = () => {
    setShowArticlesList(!showArticlesList); // Toggle de la lista de artículos
  };

  // Opciones del menú
  const menuItems = [
    { key: "inicio", label: "Inicio" },
    { key: "articles", label: "Ingresar Artículo" },
    { key: "editions", label: "Ingresar Edición" },
    { key: "account", label: "Configuración de Cuenta" },
  ];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 📌 Sidebar - Menú de navegación */}
      <div className="w-1/4 bg-white shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard Admin</h2>
        <ul>
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => setSelectedTab(item.key)}
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
      <div className="flex-1 p-6 overflow-y-auto max-h-screen">
        {selectedTab === "inicio" && (
          <>
            <DashboardStats onShowArticles={handleShowArticles} />
            {showArticlesList && <ArticlesList />}
          </>
        )}
        {selectedTab === "articles" && <CreateArticle />}
        {selectedTab === "editions" && <CreateEdition />}
        {selectedTab === "account" && <AccountSettings />}
      </div>
    </div>
  );
}

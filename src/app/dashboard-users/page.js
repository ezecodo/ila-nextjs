"use client";

import { useState } from "react";
import AccountSettings from "../../components/AccountSettings/AccountSettings";
import FavoriteArticlesList from "./FavoriteArticleList/FavoriteArticleList";

export default function UserDashboard() {
  const [selectedTab, setSelectedTab] = useState("favorites");

  // Opciones del menú
  const menuItems = [
    { key: "account", label: "Configuración de cuenta" },
    { key: "favorites", label: "Artículos Favoritos" }, // ✅ Agregamos la opción de favoritos
  ];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 📌 Sidebar - Menú de navegación */}
      <div className="w-1/4 bg-white shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
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

      {/* 📌 Área de contenido dinámico */}
      <div className="flex-1 p-6">
        {selectedTab === "account" && <AccountSettings />}
        {selectedTab === "favorites" && <FavoriteArticlesList />}{" "}
        {/* ✅ Muestra los favoritos */}
      </div>
    </div>
  );
}

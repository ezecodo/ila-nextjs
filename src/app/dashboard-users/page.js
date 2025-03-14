"use client";

import { useState } from "react";
import AccountSettings from "../../components/AccountSettings/AccountSettings";
import FavoriteArticlesList from "./FavoriteArticleList/FavoriteArticleList";

export default function UserDashboard() {
  const [selectedTab, setSelectedTab] = useState("favorites");
  const [menuOpen, setMenuOpen] = useState(false); // 🔥 Estado para menú colapsable

  // Opciones del menú
  const menuItems = [
    { key: "account", label: "Configuración de cuenta" },
    { key: "favorites", label: "Artículos Favoritos" },
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
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <ul>
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => {
                  setSelectedTab(item.key);
                  setMenuOpen(false); // 🔥 Cierra el menú en móviles al hacer clic
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

      {/* 📌 Área de contenido dinámico con scroll si es necesario */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-screen">
        {selectedTab === "account" && <AccountSettings />}
        {selectedTab === "favorites" && <FavoriteArticlesList />}{" "}
      </div>
    </div>
  );
}

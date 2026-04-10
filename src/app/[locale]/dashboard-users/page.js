"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import AccountSettings from "../components/AccountSettings/AccountSettings";
import FavoriteArticlesList from "./FavoriteArticleList/FavoriteArticleList";
import PdfDossiers from "./PdfDossiers/PdfDossiers";

export default function UserDashboard() {
  const [selectedTab, setSelectedTab] = useState("favorites");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasPdfAbo, setHasPdfAbo] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    fetch("/api/user/pdf-abo")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasPdfAbo) setHasPdfAbo(true);
      })
      .catch(() => {});
  }, []);

  const menuItems = [
    { key: "favorites", label: "Artículos Favoritos" },
    ...(hasPdfAbo ? [{ key: "pdf-dossiers", label: "📰 Mis Dossiers (PDF)" }] : []),
    { key: "account", label: "Configuración de cuenta" },
  ];

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Botón menú móvil */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="md:hidden bg-blue-500 text-white p-3 text-center w-full"
      >
        {menuOpen ? "Cerrar Menú ☰" : "Abrir Menú ☰"}
      </button>

      {/* Sidebar */}
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

      {/* Contenido */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-h-screen">
        {selectedTab === "account" && <AccountSettings />}
        {selectedTab === "favorites" && <FavoriteArticlesList />}
        {selectedTab === "pdf-dossiers" && hasPdfAbo && (
          <PdfDossiers locale={locale} />
        )}
      </div>
    </div>
  );
}


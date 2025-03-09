"use client";

import { useState } from "react";
import Link from "next/link";
import AccountSettings from "../../components/AccountSettings/AccountSettings";

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("articles");

  // Opciones del menú para Admins
  const menuItems = [
    { key: "articles", label: "Ingresar Artículos" },
    { key: "editions", label: "Ingresar Ediciones" },
    { key: "account", label: "Configuración de cuenta" },
  ];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 📌 Sidebar - Menú de navegación */}
      <div className="w-1/4 bg-white shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
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
        {selectedTab === "articles" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Ingresar Artículos</h2>
            <Link href="dashboard/articles/new">
              <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition duration-200 ease-in-out">
                <i className="fas fa-file-alt text-4xl text-red-600 mb-4"></i>
                <h2 className="text-xl font-semibold text-gray-700">
                  Ingresar Artículos
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  Añade nuevos artículos a la base de datos.
                </p>
              </div>
            </Link>
          </div>
        )}

        {selectedTab === "editions" && (
          <div>
            <h2 className="text-xl font-bold mb-4">Ingresar Ediciones</h2>
            <Link href="dashboard/editions/new">
              <div className="bg-white shadow-md rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:shadow-xl transition duration-200 ease-in-out">
                <i className="fas fa-book text-4xl text-red-600 mb-4"></i>
                <h2 className="text-xl font-semibold text-gray-700">
                  Ingresar Ediciones
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  Añade ediciones de la revista ILA.
                </p>
              </div>
            </Link>
          </div>
        )}

        {selectedTab === "account" && <AccountSettings />}
      </div>
    </div>
  );
}

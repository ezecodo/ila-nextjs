"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react"; // 🔥 Ícono de corazón

const DashboardStats = ({ onShowArticles }) => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        const data = await response.json();
        console.log("Datos obtenidos:", data);
        setStats(data);
      } catch (err) {
        console.error("Error al obtener estadísticas:", err?.message || err);
        setError("Error al cargar estadísticas.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return (
      <p className="text-center text-gray-500">Cargando estadísticas...</p>
    );
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6">📊 Dashboard</h1>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 🔥 Cantidad de artículos */}
          <div className="p-4 bg-blue-100 rounded-lg text-center shadow-md flex flex-col justify-center">
            <h3 className="text-lg font-semibold">📄 Artículos</h3>
            <p
              className="text-3xl font-bold cursor-pointer text-blue-600 hover:underline"
              onClick={onShowArticles} // 🔥 Click para mostrar la lista
            >
              {stats.totalArticles}
            </p>
          </div>

          {/* 🔥 Cantidad de ediciones */}
          <div className="p-4 bg-green-100 rounded-lg text-center shadow-md flex flex-col justify-center">
            <h3 className="text-lg font-semibold">📚 Ediciones</h3>
            <p className="text-3xl font-bold">{stats.totalEditions}</p>
          </div>

          {/* 🔥 Cantidad de usuarios */}
          <div className="p-4 bg-yellow-100 rounded-lg text-center shadow-md flex flex-col justify-center">
            <h3 className="text-lg font-semibold">👤 Usuarios</h3>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>

          {/* 🔥 Nueva métrica: Cantidad de artículos likeados con icono */}
          <div className="p-4 bg-red-100 rounded-lg text-center shadow-md flex flex-col justify-center items-center">
            <div className="flex items-center justify-center gap-2">
              <Heart
                size={26}
                className="text-red-500 stroke-black fill-red-500"
              />
              <h3 className="text-lg font-semibold">Favoritos</h3>
            </div>
            <p className="text-3xl font-bold mt-1">
              {stats.totalLikedArticles}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">
          No se encontraron estadísticas.
        </p>
      )}
    </div>
  );
};

export default DashboardStats;

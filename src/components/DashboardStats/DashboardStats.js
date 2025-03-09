"use client";

import { useEffect, useState } from "react";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    articles: 0,
    editions: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats"); // 🔥 Nueva API para obtener los datos
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Error al obtener datos");

        setStats(data);
      } catch (err) {
        setError("Error al cargar estadísticas.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">📊 Estadísticas Generales</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* 🔥 Cantidad de artículos */}
          <div className="p-4 bg-blue-100 rounded-lg text-center">
            <h3 className="text-lg font-semibold">📄 Artículos</h3>
            <p className="text-3xl font-bold">{stats.articles}</p>
          </div>

          {/* 🔥 Cantidad de ediciones */}
          <div className="p-4 bg-green-100 rounded-lg text-center">
            <h3 className="text-lg font-semibold">📚 Ediciones</h3>
            <p className="text-3xl font-bold">{stats.editions}</p>
          </div>

          {/* 🔥 Cantidad de usuarios */}
          <div className="p-4 bg-yellow-100 rounded-lg text-center">
            <h3 className="text-lg font-semibold">👤 Usuarios</h3>
            <p className="text-3xl font-bold">{stats.users}</p>
          </div>
        </div>
      )}
    </div>
  );
}

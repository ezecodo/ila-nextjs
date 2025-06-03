"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ActivityFeed() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("/api/activity-log")
      .then((res) => res.json())
      .then((data) => {
        console.log("🧾 Logs recibidos:", data.logs);
        setLogs(data.logs || []);
      })
      .catch((error) => {
        console.error("❌ Error al cargar logs:", error);
      });
  }, []);

  if (!logs.length) {
    return (
      <div className="mt-8 text-gray-500 text-sm text-center">
        🔍 No hay actividad reciente.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">📝 Actividad reciente</h2>
      <ul className="space-y-3">
        {logs.map((log) => (
          <li key={log.id} className="bg-white shadow p-4 rounded">
            <p className="text-sm">
              <strong>{log.user?.name || "Usuario"}</strong>{" "}
              {log.action === "TRANSLATE_ARTICLE"
                ? "tradujo el artículo"
                : log.action === "REVIEW_TRANSLATION"
                ? "revisó la traducción del artículo"
                : "realizó una acción"}{" "}
              <Link
                href={`/es/articles/${log.articleId}`}
                className="text-blue-600 hover:underline"
              >
                “{log.article?.title || "sin título"}”
              </Link>
            </p>

            <p className="text-xs text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

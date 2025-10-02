"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import DashboardSectionHeader from "../components/DashboardSectionHeader/DashboardSectionHeader";

export default function EventsDashboardPage() {
  const t = useTranslations("events.dashboard");
  const locale = useLocale();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Error al obtener eventos");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("❌ Error cargando eventos:", err);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* ✅ Header reutilizable */}
      <DashboardSectionHeader
        title={t("manageTitle")}
        createUrl={`/${locale}/dashboard/events/new`}
        createLabel={t("newEvent")}
        color="red"
      />

      {/* Tabla con estética moderna */}
      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className="w-full border-collapse bg-white dark:bg-gray-900 text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">
              <th className="px-5 py-3 text-left">{t("title")}</th>
              <th className="px-5 py-3 text-left">{t("date")}</th>
              <th className="px-5 py-3 text-left">{t("time")}</th>
              <th className="px-5 py-3 text-left">{t("location")}</th>
              <th className="px-5 py-3 text-center">🖼️</th>
              <th className="px-5 py-3 text-center">{t("edit")}</th>
              <th className="px-5 py-3 text-center">{t("delete")}</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <td className="px-5 py-3">
                  {locale === "es" && event.titleES
                    ? event.titleES
                    : event.title}
                </td>
                <td className="px-5 py-3">
                  {new Date(event.date).toLocaleDateString(locale)}
                </td>
                <td className="px-5 py-3">{event.time || "-"}</td>
                <td className="px-5 py-3">{event.location}</td>
                <td className="px-5 py-3 text-center">
                  {event.image ? "✔️" : "❌"}
                </td>
                <td className="px-5 py-3 text-center">
                  <Link href={`/${locale}/dashboard/events/edit/${event.id}`}>
                    <button className="text-blue-600 hover:underline">
                      {t("edit")}
                    </button>
                  </Link>
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={async () => {
                      if (
                        !confirm("⚠️ ¿Seguro que quieres eliminar este evento?")
                      )
                        return;

                      try {
                        const res = await fetch(`/api/events/${event.id}`, {
                          method: "DELETE",
                        });

                        if (!res.ok)
                          throw new Error("Error al eliminar evento");

                        // ✅ quitar de la tabla sin recargar
                        setEvents((prev) =>
                          prev.filter((e) => e.id !== event.id)
                        );
                      } catch (err) {
                        console.error("❌ Error eliminando evento:", err);
                        alert("No se pudo eliminar el evento.");
                      }
                    }}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}

            {events.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                >
                  {t("noEvents")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

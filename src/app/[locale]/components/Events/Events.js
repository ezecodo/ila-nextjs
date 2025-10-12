"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";
import SectionHeader from "../../components/SectionsHeader/SetionHeader";

export default function InfoBox() {
  const t = useTranslations("navMenu");
  const locale = useLocale();

  const [events, setEvents] = useState([]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Error al cargar eventos");
        const data = await res.json();

        // 🔹 Ordenar por fecha ascendente
        const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));

        // 🔹 Filtrar solo eventos de hoy o futuros
        const upcoming = sorted.filter(
          (e) => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0))
        );

        // 🔹 Si no hay futuros, mostrar todos (fallback)
        setEvents(upcoming.length > 0 ? upcoming : sorted);
      } catch (error) {
        console.error(error);
      }
    }

    fetchEvents();
  }, []);

  const current = events[index];
  if (!current) return null;

  return (
    <section className="w-full max-w-md mx-auto">
      <section className="w-full max-w-sm mx-auto">
        <SectionHeader title={t("events")} />

        <div className="relative bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Flechas laterales - MÁS SEPARADAS */}
          <button
            onClick={() => index > 0 && setIndex(index - 1)}
            disabled={index === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10 border border-gray-200"
          >
            <PrevArrow />
          </button>

          <button
            onClick={() => index < events.length - 1 && setIndex(index + 1)}
            disabled={index === events.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10 border border-gray-200"
          >
            <NextArrow />
          </button>

          <div className="p-6">
            {/* Fecha y Hora */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                <span className="text-red-600 mr-2">📅</span>
                {new Intl.DateTimeFormat(locale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(current.date))}
                {current.time && (
                  <>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-600">🕒 {current.time}</span>
                  </>
                )}
              </div>
            </div>

            {/* Imagen rectangular horizontal */}
            <Link
              href={`/events/${current.id}`}
              className="block w-full h-48 relative overflow-hidden bg-gray-100 shadow-md mx-auto mb-4 group"
            >
              <Image
                src={current.image}
                alt={
                  locale === "es"
                    ? current.titleES || current.title
                    : current.title
                }
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
            </Link>

            {/* Título del evento */}
            <Link href={`/events/${current.id}`}>
              <h3 className="text-lg font-bold text-gray-800 hover:text-red-600 transition-colors text-center mb-3 leading-tight">
                {locale === "es"
                  ? current.titleES || current.title
                  : current.title}
              </h3>
            </Link>

            {/* Ubicación */}
            <div className="flex items-center justify-center text-gray-600 mb-4">
              <span className="text-red-500 mr-2">📍</span>
              <span className="text-sm">{current.location}</span>
            </div>

            {/* Línea divisoria */}
            <div className="border-t border-gray-200 my-4"></div>
            {/* Indicador de evento activo */}
            <div className="flex justify-center mb-4 pt-4">
              <div className="flex space-x-1">
                {events.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === index ? "bg-red-600 w-6" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Botón de calendario */}
            <Link
              href="/events"
              className="block w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg text-center"
            >
              {t("calendarButton")}
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}

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

        function parseEventDate(e) {
          const datePart = e.date;
          const timePart = e.time || "00:00";
          return new Date(`${datePart}T${timePart}`);
        }

        const sorted = data.sort(
          (a, b) => parseEventDate(a) - parseEventDate(b),
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = sorted.filter((e) => {
          const eventDate = new Date(e.date);
          eventDate.setHours(0, 0, 0, 0);
          return eventDate >= today;
        });

        setEvents(upcoming);
      } catch (error) {
        console.error(error);
      }
    }

    fetchEvents();
  }, []);

  const current = events[index];

  const calendarLink = (
    <Link
      href="/events"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors group"
    >
      <span className="border-b border-transparent group-hover:border-white/70 transition-all">
        {locale === "es" ? "Ver calendario" : "Kalender ansehen"}
      </span>
      <span className="group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  );

  if (events.length === 0) {
    return (
      <section className="w-full max-w-md mx-auto">
        <SectionHeader title={t("events")} rightElement={calendarLink} />
        <div className="bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 p-6 text-center mt-4">
          <p className="text-gray-500 dark:text-gray-400">{t("noEvents")}</p>
        </div>
      </section>
    );
  }

  if (!current) return null;

  return (
    <section className="w-full max-w-md mx-auto">
      <SectionHeader title={t("events")} rightElement={calendarLink} />

      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 overflow-hidden mt-4">
        {/* Flechas */}
        <button
          onClick={() => index > 0 && setIndex(index - 1)}
          disabled={index === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700/90 hover:scale-110 shadow-md rounded-full p-1.5 transition-all disabled:opacity-0 disabled:cursor-not-allowed z-10 border border-gray-200 dark:border-gray-600"
        >
          <PrevArrow />
        </button>

        <button
          onClick={() => index < events.length - 1 && setIndex(index + 1)}
          disabled={index === events.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700/90 hover:scale-110 shadow-md rounded-full p-1.5 transition-all disabled:opacity-0 disabled:cursor-not-allowed z-10 border border-gray-200 dark:border-gray-600"
        >
          <NextArrow />
        </button>

        <div className="p-0">
          {/* TÍTULO */}
          <Link href={`/events/${current.id}`}>
            <h3 className="font-serif text-lg font-bold text-gray-900 dark:text-white leading-snug mb-1 text-center hover:text-red-600 dark:hover:text-red-500 transition-colors">
              {locale === "es"
                ? current.titleES || current.title
                : current.title}
            </h3>
          </Link>
          {/* Fila de datos */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {/* Fecha */}
            <span className="flex items-center gap-1">
              <span className="text-red-500">📅</span>
              {new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(current.date))}
            </span>

            {/* Separador */}
            <span className="text-gray-300 dark:text-gray-700">|</span>

            {/* Hora (si existe) */}
            {current.time && (
              <span className="flex items-center gap-1">
                <span className="text-red-500">🕒</span>
                {current.time}
              </span>
            )}

            {/* Separador (solo si hay hora) */}
            {current.time && (
              <span className="text-gray-300 dark:text-gray-700">|</span>
            )}

            {/* Ubicación */}
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <span className="text-red-500">📍</span>
              {current.location}
            </span>
          </div>

          {/* IMAGEN */}
          <Link
            href={`/events/${current.id}`}
            className="block w-full h-40 relative overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-none mb-3 group"
          >
            <Image
              src={current.image}
              alt={
                locale === "es"
                  ? current.titleES || current.title
                  : current.title
              }
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-black/0 dark:bg-black/20 transition-all duration-300" />
          </Link>

          {/* Indicadores */}
          <div className="flex justify-center">
            <div className="flex space-x-1.5">
              {events.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i === index
                      ? "bg-red-600 w-4"
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

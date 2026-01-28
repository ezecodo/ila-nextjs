"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
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

  const ChevronLeft = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#BD0E0D]"
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );

  const ChevronRight = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#BD0E0D]"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  return (
    <section className="w-full max-w-md mx-auto">
      <SectionHeader title={t("events")} rightElement={calendarLink} />

      <div className="relative bg-white dark:bg-gray-800 rounded-none shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden mt-0 flex flex-col">
        {/* 1. CONTENIDO (METADATOS + TÍTULO) - Ahora arriba */}
        <div className="px-0 flex flex-col">
          {/* METADATOS - Arriba con tinte visual */}
          <div className="flex items-center justify-start gap-2 text-xs font-bold text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-200 py-1 px-1 ml-2">
            <span className=" text-red-600 font-semibold uppercase tracking-wider">
              {new Intl.DateTimeFormat(locale, {
                day: "numeric",
                month: "short",
              }).format(new Date(current.date))}
            </span>

            <span className="text-[#BD0E0D]">|</span>

            {current.time && (
              <>
                <span>{current.time}</span>
                <span className="text-[#BD0E0D]">|</span>
              </>
            )}

            <span className="truncate max-w-[150px]">{current.location}</span>
          </div>
          {/* TÍTULO */}
          <Link href={`/events/${current.id}`}>
            <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2 mt-2 justify-start hover:text-red-600 dark:hover:text-red-500 transition-colors line-clamp-2 ml-2">
              {locale === "es"
                ? current.titleES || current.title
                : current.title}
            </h3>
          </Link>
        </div>

        {/* 2. IMAGEN (HERO) - Ahora debajo */}
        <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-700 shrink-0 group">
          <Link href={`/events/${current.id}`} className="block w-full h-full">
            <Image
              src={current.image}
              alt={
                locale === "es"
                  ? current.titleES || current.title
                  : current.title
              }
              fill
              className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </Link>

          {/* Indicador de cantidad */}
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-none">
            {index + 1} / {events.length}
          </div>
        </div>

        {/* 4. NAVEGACIÓN (Flechitas + Puntos) */}
        <div className="border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-0">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => index > 0 && setIndex(index - 1)}
              disabled={index === 0}
              className="text-[#BD0E0D] hover:text-red-800 hover:scale-125 disabled:opacity-20 disabled:hover:scale-100 transition-all p-1"
              aria-label="Anterior"
            >
              <ChevronLeft />
            </button>

            <div className="flex items-center gap-2">
              {events.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1 rounded-none transition-all duration-300 ${
                    i === index
                      ? "bg-red-600 w-5"
                      : "bg-gray-300 dark:bg-gray-600 w-1 hover:bg-gray-400"
                  }`}
                  aria-label={`Ir a evento ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => index < events.length - 1 && setIndex(index + 1)}
              disabled={index === events.length - 1}
              className="text-[#BD0E0D] hover:text-red-800 hover:scale-125 disabled:opacity-20 disabled:hover:scale-100 transition-all p-1"
              aria-label="Siguiente"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-6 text-center mt-4">
          <p className="text-gray-500 dark:text-gray-400">{t("noEvents")}</p>
        </div>
      </section>
    );
  }

  if (!current) return null;

  const ChevronLeft = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400 hover:text-red-600 transition-colors"
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );

  const ChevronRight = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400 hover:text-red-600 transition-colors"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  return (
    <section className="w-full max-w-md mx-auto">
      <SectionHeader title={t("events")} rightElement={calendarLink} />

      <div className="flex flex-col justify-between p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 mt-4 relative">
        <Link href={`/events/${current.id}`} className="group block w-full">
          <div className="flex flex-col gap-2">
            {/* Metadatos */}
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              <span className="text-red-600 font-bold uppercase tracking-wider">
                {new Intl.DateTimeFormat(locale, {
                  day: "numeric",
                  month: "short",
                }).format(new Date(current.date))}
              </span>

              <span className="text-gray-300 dark:text-gray-600">|</span>

              {current.time && (
                <>
                  <span>{current.time}</span>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                </>
              )}

              <span className="truncate">{current.location}</span>
            </div>

            {/* Título */}
            <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors cursor-pointer">
              {locale === "es"
                ? current.titleES || current.title
                : current.title}
            </h3>
          </div>

          {/* 
             AJUSTE FINAL:
             - rounded-none: Esquinas totalmente rectas.
             - group-hover:h-80: Más altura (320px) para ver la foto completa.
          */}
          <div className="w-full overflow-hidden transition-all duration-500 ease-in-out h-0 opacity-0 group-hover:h-80 group-hover:opacity-100 group-hover:mt-3 rounded-none">
            <div className="relative w-full h-full bg-gray-100 dark:bg-gray-700">
              <Image
                src={current.image}
                alt={
                  locale === "es"
                    ? current.titleES || current.title
                    : current.title
                }
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
          </div>
        </Link>

        {/* Navegación */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50">
          <button
            onClick={() => index > 0 && setIndex(index - 1)}
            disabled={index === 0}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            aria-label="Anterior"
          >
            <ChevronLeft />
          </button>

          <div className="flex items-center gap-1.5">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "bg-red-600 w-4"
                    : "bg-gray-200 dark:bg-gray-600 w-1.5 hover:bg-gray-300"
                }`}
                aria-label={`Ir a evento ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => index < events.length - 1 && setIndex(index + 1)}
            disabled={index === events.length - 1}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
            aria-label="Siguiente"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}

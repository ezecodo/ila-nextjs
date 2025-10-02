"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addDays,
} from "date-fns";
import { es, enUS, de } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";

// Mapa de locales de next-intl a date-fns
const dateFnsLocales = {
  en: enUS,
  es: es,
  de: de,
};

export default function EventsPage() {
  const t = useTranslations("events");
  const locale = useLocale(); // Obtiene el locale actual (ej: "es", "en", "de")
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Obtiene el locale de date-fns correspondiente
  const dateFnsLocale = dateFnsLocales[locale] || enUS;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Error al cargar eventos");
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getMonth() === currentMonth.getMonth() &&
      eventDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
        className="p-2 rounded-full hover:bg-gray-100 transition-all"
        aria-label={t("previousMonth")}
      >
        ⟵
      </button>
      <h1 className="text-xl font-semibold">
        {format(currentMonth, "MMMM yyyy", { locale: dateFnsLocale })}
      </h1>
      <button
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="p-2 rounded-full hover:bg-gray-100 transition-all"
        aria-label={t("nextMonth")}
      >
        ⟶
      </button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { locale: dateFnsLocale });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={i}
          className="text-center text-xs font-semibold text-gray-600"
        >
          {format(addDays(startDate, i), "EEEEEE", { locale: dateFnsLocale })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: dateFnsLocale });
    const endDate = endOfWeek(monthEnd, { locale: dateFnsLocale });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, "yyyy-MM-dd");
        const dayEvents = events.filter(
          (event) =>
            format(new Date(event.date), "yyyy-MM-dd") === formattedDate
        );

        days.push(
          <div
            key={day}
            className={`h-16 border p-0.5 text-[11px] relative rounded bg-white flex flex-col justify-between ${
              !isSameMonth(day, monthStart) ? "text-gray-300 bg-gray-50" : ""
            }`}
          >
            <div className="text-right pr-1 pt-0.5 font-semibold text-gray-700">
              {format(day, "d")}
            </div>

            {/* Miniatura del evento */}
            {dayEvents.slice(0, 1).map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div
                  title={
                    locale === "es" ? event.titleES || event.title : event.title
                  }
                  className="w-full h-10 relative rounded overflow-hidden mx-auto mt-0.5 group cursor-pointer"
                >
                  <Image
                    src={event.image}
                    alt={
                      locale === "es"
                        ? event.titleES || event.title
                        : event.title
                    }
                    fill
                    className="object-cover group-hover:brightness-90 transition"
                  />
                </div>
              </Link>
            ))}

            {/* Conteo adicional si hay más */}
            {dayEvents.length > 1 && (
              <p className="text-[10px] text-center text-gray-500 mt-0.5">
                +{dayEvents.length - 1} {t("more")}
              </p>
            )}
          </div>
        );

        day = addDays(day, 1);
      }

      rows.push(
        <div key={day} className="grid grid-cols-7 gap-1 mb-1">
          {days}
        </div>
      );
      days = [];
    }

    return <div>{rows}</div>;
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        {t("title")}
      </h1>

      <div className="bg-gray-50 rounded-md p-3 shadow-sm max-w-4xl mx-auto">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      {/* Lista de eventos del mes actual */}
      <div className="mt-8 space-y-4">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-gray-500">{t("noEvents")}</p>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id}>
              <Link href={`/events/${event.id}`} className="block">
                <div className="rounded-lg bg-white shadow-md hover:shadow-xl transition-transform transform hover:scale-105 duration-200 border flex items-center p-3 gap-4">
                  <div className="relative flex-shrink-0 w-24 h-32">
                    <Image
                      src={event.image}
                      alt={event.title || t("eventImageAlt")}
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {locale === "es"
                        ? event.titleES || event.title
                        : event.title}
                    </h2>
                    <p className="text-gray-500 text-xs">
                      {new Date(event.date).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {event.time && (
                        <span className="ml-2 text-gray-600">
                          🕒 {event.time}
                        </span>
                      )}
                    </p>
                    <div
                      className="mt-1 text-gray-700 text-sm line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html:
                          locale === "es"
                            ? event.descriptionES || event.description
                            : event.description,
                      }}
                    />
                    <p className="mt-2 text-blue-500 font-semibold text-sm">
                      📍 <span className="underline">{event.location}</span>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

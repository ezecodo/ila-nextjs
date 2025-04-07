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
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";

export default function EventsPage() {
  const t = useTranslations("events");
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
      >
        ⟵
      </button>
      <h1 className="text-xl font-semibold">
        {format(currentMonth, "MMMM yyyy", { locale: es })}
      </h1>
      <button
        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        className="p-2 rounded-full hover:bg-gray-100 transition-all"
      >
        ⟶
      </button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth, { locale: es });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center text-sm font-medium text-gray-600">
          {format(addDays(startDate, i), "EEEEEE", { locale: es })}
        </div>
      );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });

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
            className={`h-20 border p-1 text-sm relative rounded-md shadow-sm bg-white ${
              !isSameMonth(day, monthStart) ? "text-gray-300" : ""
            }`}
          >
            <div className="text-right pr-1 font-medium">
              {format(day, "d")}
            </div>
            {dayEvents.slice(0, 3).map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div
                  className="mt-1 text-xs bg-indigo-500 text-white px-1 py-0.5 rounded truncate cursor-pointer hover:bg-indigo-600"
                  title={event.title}
                >
                  {event.title}
                </div>
              </Link>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500 mt-1">
                +{dayEvents.length - 3} más
              </div>
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
        {t("events")}
      </h1>

      <div className="bg-gray-50 rounded-lg p-4 shadow">
        {renderHeader()}
        {renderDays()}
        {renderCells()}
      </div>

      {/* Lista de eventos del mes actual */}
      <div className="mt-8 space-y-4">
        {filteredEvents.length === 0 ? (
          <p className="text-center text-gray-500">No hay eventos este mes.</p>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id}>
              <Link href={`/events/${event.id}`} className="block">
                <div className="rounded-lg bg-white shadow-md hover:shadow-xl transition-transform transform hover:scale-105 duration-200 border flex items-center p-3 gap-4">
                  <div className="relative flex-shrink-0 w-24 h-32">
                    <Image
                      src={event.image}
                      alt={event.title || "Imagen del evento"}
                      fill
                      className="object-contain rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {event.title}
                    </h2>
                    <p className="text-gray-500 text-xs">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-gray-700 text-sm line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                </div>
              </Link>

              {/* ✅ Enlace a Google Maps por fuera del <Link> */}
              <p className="mt-2 text-blue-500 font-semibold text-sm pl-28">
                📍{" "}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    event.location
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {event.location}
                </a>
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";

export default function InfoBox() {
  const t = useTranslations("navMenu");

  const [events, setEvents] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("Error al cargar eventos");
        const data = await res.json();
        setEvents(data);
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
        {/* Título */}
        <div className="bg-red-50 pl-6 py-2 rounded-t-md text-red-800 text-xl font-serif font-bold text-left">
          {t("events")}
        </div>

        {/* Contenedor del evento */}
        <div className="relative bg-white text-red-700 px-4 py-5 shadow-sm flex flex-col items-center text-center gap-2 w-full rounded-b-md border border-red-200">
          {/* Flechas laterales */}
          <div className="absolute left-[1rem] top-1/2 -translate-y-1/2 -translate-x-full z-10">
            <PrevArrow
              onClick={() => index > 0 && setIndex(index - 1)}
              className={index === 0 ? "opacity-40 pointer-events-none" : ""}
            />
          </div>
          <div className="absolute right-[1rem] top-1/2 -translate-y-1/2 translate-x-full z-10">
            <NextArrow
              onClick={() => index < events.length - 1 && setIndex(index + 1)}
              className={
                index === events.length - 1
                  ? "opacity-40 pointer-events-none"
                  : ""
              }
            />
          </div>

          {/* Fecha */}
          <p className="text-sm font-bold flex items-center gap-2 mt-1">
            📅{" "}
            {new Date(current.date).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* Imagen más grande */}
          <Link
            href={`/events/${current.id}`}
            className="w-44 h-44 relative rounded-md overflow-hidden bg-white shadow-sm"
          >
            <Image
              src={current.image}
              alt={current.title}
              fill
              className="object-contain p-2"
            />
          </Link>

          {/* Título */}
          <Link href={`/events/${current.id}`}>
            <h3 className="text-base font-bold hover:underline mt-1">
              {current.title}
            </h3>
          </Link>

          {/* Ubicación */}
          <p className="text-sm mb-1">📍 {current.location}</p>

          {/* Botón */}
          <Link
            href="/events"
            className="bg-red-600 text-white font-semibold px-4 py-2 rounded hover:bg-red-700 transition text-sm mt-2"
          >
            {t("calendarButton")}
          </Link>
        </div>
      </section>
    </section>
  );
}

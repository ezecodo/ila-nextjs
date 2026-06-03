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
        <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center mt-4">
          <p className="text-gray-500 dark:text-gray-400">{t("noEvents")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md mx-auto">
      <SectionHeader title={t("events")} rightElement={calendarLink} />

      {/* Lista vertical estilo Aktuelles — sin carrusel */}
      <div className="flex flex-col gap-4 mt-4">
        {events.slice(0, 3).map((ev) => {
          const eventTitle =
            locale === "es" ? ev.titleES || ev.title : ev.title;

          return (
            <div
              key={ev.id}
              className="group flex flex-col p-3 rounded-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
            >
              <Link href={`/events/${ev.id}`} className="block w-full">
                <div className="flex flex-col gap-2">
                  {/* Metadatos */}
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span className="text-[#BD0E0D] font-bold uppercase tracking-wider">
                      {new Intl.DateTimeFormat(locale, {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(ev.date))}
                    </span>

                    {ev.time && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">
                          |
                        </span>
                        <span>{ev.time}</span>
                      </>
                    )}

                    {ev.location && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">
                          |
                        </span>
                        <span className="truncate">{ev.location}</span>
                      </>
                    )}
                  </div>

                  {/* Título — sans + subrayado animado, alineado al grid */}
                  <h3 className="text-[17px] font-bold leading-[1.25] text-gray-900 dark:text-white text-balance">
                    <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
                      {eventTitle}
                    </span>
                  </h3>
                </div>

                {/* Imagen que se despliega en hover */}
                {ev.image && (
                  <div className="w-full overflow-hidden transition-all duration-500 ease-in-out h-0 opacity-0 group-hover:h-80 group-hover:opacity-100 group-hover:mt-3">
                    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-700">
                      <Image
                        src={ev.image}
                        alt={eventTitle}
                        fill
                        className="object-cover object-center"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

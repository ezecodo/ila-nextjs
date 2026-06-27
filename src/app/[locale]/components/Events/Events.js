"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import QuietSectionHeader from "../../components/SectionsHeader/QuietSectionHeader";

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
      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#BD0E0D] hover:text-[#a50c0b] transition-colors group whitespace-nowrap"
    >
      <span className="border-b border-transparent group-hover:border-[#BD0E0D] transition-all">
        {locale === "es" ? "Ver calendario" : "Kalender ansehen"}
      </span>
      <span className="group-hover:translate-x-1 transition-transform">→</span>
    </Link>
  );

  if (events.length === 0) {
    return (
      <section className="w-full max-w-md mx-auto">
        <QuietSectionHeader
          variant="chip"
          title={t("events")}
          rightElement={calendarLink}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          {t("noEvents")}
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-md mx-auto">
      <QuietSectionHeader
        variant="chip"
        title={t("events")}
        rightElement={calendarLink}
      />

      {/* Lista vertical — filas sin caja, separadas por hairlines */}
      <div className="flex flex-col">
        {events.slice(0, 3).map((ev) => {
          const eventTitle =
            locale === "es" ? ev.titleES || ev.title : ev.title;

          return (
            <article
              key={ev.id}
              className="group py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
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

                  {/* Título — sans + subrayado animado */}
                  <h3 className="text-[16px] font-bold leading-[1.3] text-gray-900 dark:text-white text-balance">
                    <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
                      {eventTitle}
                    </span>
                  </h3>
                </div>

                {/* Imagen: siempre visible en mobile; en desktop se despliega en hover */}
                {ev.image && (
                  <div className="w-full overflow-hidden transition-all duration-500 ease-in-out h-80 opacity-100 mt-3 lg:h-0 lg:opacity-0 lg:mt-0 lg:group-hover:h-80 lg:group-hover:opacity-100 lg:group-hover:mt-3">
                    <div className="relative w-full h-full bg-gray-50 dark:bg-gray-800">
                      <Image
                        src={ev.image}
                        alt={eventTitle}
                        fill
                        quality={90}
                        className="object-contain object-center"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                  </div>
                )}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

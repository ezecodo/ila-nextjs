"use client";

import { useLocale } from "next-intl";
import { FaRegCalendarAlt } from "react-icons/fa";
import IlaLogo50 from "../../IlaLogo/ilaLogo50";

function addToCalendar() {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ila//Geburtstagsparty//DE",
    "BEGIN:VEVENT",
    "DTSTART:20260905T180000",
    "SUMMARY:ila-Geburtstagsparty 🎉",
    "DESCRIPTION:Ihr seid alle herzlich eingeladen zu unserer großen Geburtstagsparty im Allerweltshaus in Köln!",
    "LOCATION:Allerweltshaus\\, Köln",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ila-Geburtstagsparty.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export default function PartyBanner() {
  const locale = useLocale();

  const content = {
    de: {
      kicker: "50 Jahre ila · Einladung",
      title: "Geburtstagsparty",
      text: "Ihr seid alle herzlich eingeladen zu unserer großen Geburtstagsparty in diesem Herbst im Allerweltshaus in Köln",
      date: "Sa. 5. September · ab 18 Uhr",
    },
    es: {
      kicker: "50 años de ila · Invitación",
      title: "Fiesta de cumpleaños",
      text: "Están todxs cordialmente invitadxs a nuestra gran fiesta de cumpleaños este otoño en el Allerweltshaus de Colonia",
      date: "Sáb. 5 de septiembre · 18 h",
    },
  };

  const t = content[locale] || content.de;
  const futura = { fontFamily: "Futura Cyrillic, Arial, sans-serif" };

  return (
    <div className="relative overflow-hidden bg-[#BD0E0D] text-white px-6 py-10 shadow-md flex flex-col items-center justify-center text-center -mx-2 sm:mx-0 flex-1 min-h-[356px]">
      {/* "50" gigante de fondo, centrado */}
      <span
        className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 select-none text-[220px] font-extrabold leading-none text-white/20"
        style={futura}
        aria-hidden="true"
      >
        50
      </span>

      <div className="relative flex max-w-md flex-col items-center gap-3">
        {/* Kicker */}
        <p
          className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70"
          style={futura}
        >
          {t.kicker}
        </p>

        {/* Logo + título en la misma línea, alineados por baseline.
            El "ila" del SVG tiene su baseline al 85% de la caja de 80px (≈68px),
            así que recortamos el alto del wrapper a 68px para que su borde
            inferior coincida con esa baseline y items-baseline haga el resto. */}
        <div className="flex items-baseline justify-center gap-2 sm:gap-3">
          <span
            className="relative inline-block shrink-0 overflow-visible"
            style={{ width: 80, height: 68 }}
          >
            <span className="absolute left-0 top-0">
              <IlaLogo50
                size="mini"
                show50={false}
                isLink={false}
                animated={false}
              />
            </span>
          </span>
          <h3
            className="text-2xl font-extrabold leading-none tracking-tight sm:text-3xl md:text-4xl"
            style={futura}
          >
            {t.title}
          </h3>
        </div>

        {/* Texto */}
        <p className="text-base leading-snug text-white/90 md:text-lg">
          {t.text}
        </p>

        {/* Mobile: botón que guarda en calendario */}
        <button
          onClick={addToCalendar}
          className="mt-2 inline-flex items-center gap-2 rounded-none bg-white px-4 py-2 text-sm font-bold text-[#BD0E0D] shadow-sm transition-all duration-150 active:scale-95 md:hidden"
          title={locale === "es" ? "Guardar en calendario" : "Im Kalender speichern"}
        >
          <FaRegCalendarAlt className="text-xs" /> {t.date}
        </button>

        {/* Desktop: solo texto, sin acción */}
        <div className="mt-2 hidden items-center gap-2 rounded-none bg-white px-4 py-2 text-base font-bold text-[#BD0E0D] shadow-sm md:inline-flex">
          <FaRegCalendarAlt className="text-sm" /> {t.date}
        </div>
      </div>
    </div>
  );
}

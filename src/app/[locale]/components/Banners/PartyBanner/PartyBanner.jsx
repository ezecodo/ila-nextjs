"use client";

import { useLocale } from "next-intl";
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
      title: "Geburtstagsparty",
      text: "Ihr seid alle herzlich eingeladen zu unserer großen Geburtstagsparty in diesem Herbst im Allerweltshaus in Köln",
      date: "Sa. 5. September · ab 18 Uhr",
    },
    es: {
      title: "Fiesta de cumpleaños",
      text: "Están todxs cordialmente invitadxs a nuestra gran fiesta de cumpleaños este otoño en el Allerweltshaus de Colonia",
      date: "Sáb. 5 de septiembre · 18 h",
    },
  };

  const t = content[locale] || content.de;

  return (
    <div
      className="relative overflow-hidden text-white px-5 py-[34px] md:py-[38px] shadow-xl flex flex-col items-center justify-center text-center gap-2 -mx-4 sm:mx-0 flex-1 min-h-[356px]"
      style={{
        background: "radial-gradient(ellipse at top left, #d4150e 0%, #BD0E0D 45%, #8a0908 100%)",
      }}
    >
      {/* Círculos decorativos de fondo */}
      <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
      <div className="absolute top-1/2 -right-6 w-20 h-20 rounded-full bg-black/10" />
      <div className="absolute -top-4 right-1/3 w-12 h-12 rounded-full bg-white/5" />

      <style jsx>{`
        @keyframes glow-pulse {
          0%,
          100% {
            text-shadow:
              0 0 8px rgba(255, 255, 255, 0.4),
              0 0 20px rgba(255, 255, 255, 0.2);
          }
          50% {
            text-shadow:
              0 0 16px rgba(255, 255, 255, 0.9),
              0 0 40px rgba(255, 255, 255, 0.5);
          }
        }
        .glow-text {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Logo ila 50 */}
      <IlaLogo50
        size="mini"
        show50={true}
        isLink={false}
        animated={true}
        animationType="fifty-pulse"
        className="-translate-y-1 -my-3"
      />

      {/* Título con shimmer */}
      <h3 className="glow-text text-3xl md:text-4xl font-black tracking-tight leading-none text-white">
        {t.title}
      </h3>

      {/* Texto */}
      <p className="text-lg md:text-xl leading-tight md:leading-snug font-medium text-white/95">
        {t.text}
      </p>

      {/* Mobile: botón que guarda en calendario */}
      <button
        onClick={addToCalendar}
        className="md:hidden mt-1 bg-white text-[#BD0E0D] font-black text-sm px-4 py-2 rounded-sm shadow-md tracking-wide active:scale-95 transition-all duration-150"
        title={locale === "es" ? "Guardar en calendario" : "Im Kalender speichern"}
      >
        🗓 {t.date}
      </button>

      {/* Desktop: solo texto, sin acción */}
      <div className="hidden md:block mt-1 bg-white text-[#BD0E0D] font-black text-base px-4 py-2 rounded-sm shadow-md tracking-wide">
        🗓 {t.date}
      </div>
    </div>
  );
}

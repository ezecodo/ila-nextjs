"use client";

import { useLocale } from "next-intl";
import IlaLogo50 from "../../IlaLogo/ilaLogo50";

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
      text: "Están todos cordialmente invitadxs a nuestra gran fiesta de cumpleaños este otoño en el Allerweltshaus de Colonia",
      date: "Sáb. 5 de septiembre · 18 h",
    },
  };

  const t = content[locale] || content.de;

  return (
    <div className="bg-[#BD0E0D] text-white px-5 py-[34px] md:py-[38px] shadow-xl flex flex-col items-center justify-center text-center gap-2 -mx-4 sm:mx-0 flex-1 min-h-[356px]">
      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 8px rgba(255,255,255,0.4), 0 0 20px rgba(255,255,255,0.2); }
          50% { text-shadow: 0 0 16px rgba(255,255,255,0.9), 0 0 40px rgba(255,255,255,0.5); }
        }
        .glow-text {
          animation: glow-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Logo ila 50 */}
      <IlaLogo50
        size="mobile"
        show50={true}
        isLink={false}
        animated={true}
        animationType="fifty-pulse"
        className="transform scale-[0.82] -my-2"
      />

      {/* Título con shimmer */}
      <h3 className="glow-text text-3xl md:text-4xl font-black tracking-tight leading-none text-white">
        {t.title}
      </h3>

      {/* Texto */}
      <p className="text-lg md:text-xl leading-tight md:leading-snug font-medium text-white/95">
        {t.text}
      </p>

      {/* Etiqueta de fecha */}
      <div className="mt-1 bg-white text-[#BD0E0D] font-black text-sm md:text-base px-4 py-2 rounded-sm shadow-md tracking-wide">
        🗓 {t.date}
      </div>
    </div>
  );
}

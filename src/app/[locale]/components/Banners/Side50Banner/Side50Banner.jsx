"use client";

import { useLocale } from "next-intl";
import Link from "next/link";

export default function Banner50Compact() {
  const locale = useLocale();

  const content = {
    de: {
      title: "Wir werden 50!",
      fullText: `Es wäre Zeit, die ila an den Nagel zu hängen und sich zurückzulehnen. In einer Welt in der der US-Präsident "Amerika den (US-)Amerikanern" wieder zur Leitlinie seiner Politik macht und der deutsche Kanzler das Ganze nur als "komplex" sehen kann? In einer Gegenwart wo rechte Kräfte im Vormarsch sind und dennoch überall Menschen tagtäglich widerstehen, für ein gutes Leben und solidarische Gesellschaften kämpfen? Wir feiern und machen weiter. Und ihr?`,
      cta1: "Abonnieren",
      cta2: "Mitmachen",
      cta3: "Spenden",
    },
    es: {
      title: "¡Cumplimos 50!",
      fullText: `Sería tiempo de colgar los guantes y relajarse. ¿En un mundo donde el presidente de EE. UU. vuelve a hacer de "América para los estadounidenses" la guía de su política y el canciller alemán solo ve todo esto como "complejo"? ¿En un presente donde las fuerzas de derecha están en auge y, sin embargo, en todas partes la gente resiste día a día, luchando por una buena vida y sociedades solidarias? Celebramos y seguimos. ¿Y tú?`,
      cta1: "Suscríbete",
      cta2: "Únete",
      cta3: "Dona",
    },
  };

  const t = content[locale] || content.de;

  return (
    <div className="bg-[#89B881] text-white p-4 md:p-8 shadow-xl flex flex-col items-center text-center gap-5 border-t-4 border-green-700 -mx-4 sm:mx-0">
      {/* HEADER: Logo y Título con presencia */}
      <div className="flex items-center w-full justify-center gap-2">
        {/* Título muy grande y visible */}
        <div className="text-center flex-1 min-w-0">
          <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-none text-white break-words">
            {t.title}
          </h3>
        </div>
      </div>

      {/* TEXTO PRINCIPAL */}
      <div className="w-full text-center">
        <p className="text-lg md:text-xl leading-tight md:leading-snug font-medium text-white/95">
          {t.fullText}
        </p>
      </div>

      {/* BOTONES DE ACCIÓN - Los 3 en línea */}
      <div className="w-full mt-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Link
            href="/order/abo"
            className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-3 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg"
          >
            {t.cta1}
          </Link>
          <Link
            href="/support/participate"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-3 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg"
          >
            {t.cta2}
          </Link>
          <Link
            href="/support/donations"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-3 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg"
          >
            {t.cta3}
          </Link>
        </div>
      </div>
    </div>
  );
}

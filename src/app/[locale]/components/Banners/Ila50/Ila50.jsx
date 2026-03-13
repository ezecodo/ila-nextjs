"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

export default function Banner50({ variant = "gold" }) {
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  // Configuración de estilos por variante para manejar colores y contrastes
  const theme = {
    gold: {
      bg: "bg-[#EEB546]",
      textMain: "text-gray-900", // Texto oscuro para fondo amarillo
      textMuted: "text-gray-800/80",
      btnMain: "bg-gray-900 text-white hover:bg-black", // Botón oscuro
      btnSecondary: "bg-white text-gray-900 hover:bg-gray-50",
      cardBorder: "border-gray-200",
      arrowColor: "text-gray-900",
    },
    green: {
      bg: "bg-[#89B881]",
      textMain: "text-white", // Texto blanco para fondo verde (mejor contraste)
      textMuted: "text-white/90",
      btnMain: "bg-white text-[#89B881] hover:bg-gray-50", // Botón blanco
      btnSecondary:
        "bg-transparent border-2 border-white text-white hover:bg-white/10",
      cardBorder: "border-green-100",
      arrowColor: "text-white",
    },
  };

  const currentTheme = theme[variant] || theme.gold;

  const content = {
    de: {
      title: "50 Jahre. Ein Grund zum Feiern?",
      subtitle: "Wir feiern und machen weiter. Und ihr?",
      fullText: `Nach 50 Jahren wäre es vielleicht Zeit, die ila an den Nagel hängen, sich zurückzulehnen und ab und zu sich ohne Stress zu treffen. In einer Welt in der der US-Präsident ein Land überfallen und dessen Präsidenten entführen kann, andere ständig bedroht und "Amerika den (US-)Amerikanern" wieder zur Leitlinie seiner Politik macht? In einem Umfeld, wo der deutsche Kanzler das Ganze nur als "komplex" sehen kann? In einer Gegenwart, wo auch in Lateinamerika, politische Kräfte im Vormarsch sind, die Egoismus und Ausgrenzung zum Kernpunkt ihres Programms machen und wo dennoch überall Menschen tagtäglich widerstehen, für ein gutes Leben und für solidarische Gesellschaften kämpfen? In so einer Welt können wir nicht aufhören. Wir feiern und machen weiter. Und ihr?`,
      expandBtn: "Mehr erfahren",
      collapseBtn: "Schließen",
      cta1: "Abonnieren",
      cta2: "Mitmachen",
      cta3: "Spenden",
    },
    es: {
      title: "50 años. ¿Un motivo para celebrar?",
      subtitle: "Celebramos y seguimos. ¿Y tú?",
      fullText: `Después de 50 años, tal vez haya llegado el momento de colgar los guantes, reclinarse y reunirse de vez en cuando sin estrés. En un mundo en el que el presidente de EE UU puede invadir un país y secuestrar a su presidente, amenazar a medio mundo y volver a hacer de "América para los (EE UU) americanos" el principio rector de su política? En un entorno en el que la canciller alemán ve estos ataques contra el derecho internacional simplemente como un hecho "complejo"? En un presente en el que, incluso en América Latina, están en auge fuerzas políticas cuyo programa es el egoísmo y la exclusión, y sin embargo, la gente resiste día a día, y lucha por una vida mejor, por sociedades basadas en la solidaridad? En un mundo así, no podemos colgar los guantes. Celebramos y seguimos. ¿Y tú?`,
      expandBtn: "Leer manifiesto",
      collapseBtn: "Cerrar",
      cta1: "Suscríbete",
      cta2: "Únete",
      cta3: "Dona",
    },
  };

  const t = content[locale] || content.de;

  return (
    <div
      className={`w-full relative ${currentTheme.bg} transition-colors duration-500`}
    >
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* --- Sección Superior --- */}
        {/* --- Sección Superior --- */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
          {/* Título y Subtítulo */}
          <div className="text-center lg:text-left">
            <h2
              className={`text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-2 ${currentTheme.textMain}`}
            >
              {t.title}
            </h2>
            <p
              className={`text-sm md:text-base font-bold uppercase tracking-[0.15em] ${currentTheme.textMuted}`}
            >
              {t.subtitle}
            </p>
          </div>

          {/* Botón Toggle */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setExpanded(!expanded)}
              className={`group flex items-center gap-3 px-8 py-3 rounded-full font-semibold transition-all duration-300 ${
                variant === "gold"
                  ? "bg-gray-900 text-white hover:bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  : "bg-white text-[#89B881] hover:bg-gray-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              }`}
            >
              <span>{expanded ? t.collapseBtn : t.expandBtn}</span>
              <span
                className={`transition-transform duration-300 ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`}
              >
                ↓
              </span>
            </button>
          </div>
        </div>

        {/* --- Sección Expandible (El Manifiesto) --- */}
        <div
          className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
            expanded ? "max-h-[1000px] opacity-100 mt-16" : "max-h-0 opacity-0"
          }`}
        >
          {/* Tarjeta Blanca Sólida: Limpia, legible y profesional sobre cualquier fondo */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-100 relative overflow-hidden">
            {/* Elemento decorativo sutil */}
            <div
              className={`absolute top-0 left-0 w-2 h-full ${variant === "gold" ? "bg-[#EEB546]" : "bg-[#89B881]"}`}
            ></div>

            <div className="max-w-3xl mx-auto">
              <p className="text-gray-800 text-lg md:text-xl leading-relaxed font-serif text-justify mb-10">
                {t.fullText}
              </p>

              {/* Botones de Acción */}
              <div className="flex flex-wrap justify-center gap-4 pt-6 border-t border-gray-100">
                <Link
                  href="/order/abo"
                  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all hover:scale-105 shadow-md hover:shadow-lg ${
                    variant === "gold"
                      ? "bg-[#EEB546] text-gray-900 hover:bg-[#d9a03e]"
                      : "bg-[#89B881] text-white hover:bg-[#76a36f]"
                  }`}
                >
                  {t.cta1}
                </Link>

                <Link
                  href="/support/participate"
                  className="px-8 py-3 rounded-lg font-bold text-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-105"
                >
                  {t.cta2}
                </Link>

                <Link
                  href="/support/donations"
                  className="px-8 py-3 rounded-lg font-bold text-lg text-gray-700 border-2 border-gray-200 hover:border-gray-900 hover:text-gray-900 transition-all hover:scale-105"
                >
                  {t.cta3}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

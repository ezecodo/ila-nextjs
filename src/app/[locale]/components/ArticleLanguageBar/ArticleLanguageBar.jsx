"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

// Barra "Auch lesen auf: Español · Português" debajo del título del artículo
// (ausgaben/online). Se arma sola con los idiomas que el artículo realmente
// tiene: `links` = { de, es, pt } con el href de cada versión o null si no
// existe. `current` = idioma que se está leyendo (no se lista a sí mismo).
// Si no hay otro idioma disponible, no renderiza nada.
//
// Reemplaza los dos links sueltos que había antes ("También disponible en
// español →" / "Original auf Deutsch verfügbar →"). La "versión original"
// (originalLanguage/originalContent) es otra cosa y sigue con su propio link.
const ORDER = ["de", "es", "pt"];

export default function ArticleLanguageBar({ current, links, className = "" }) {
  const t = useTranslations("articleLanguages");
  const others = ORDER.filter((lang) => lang !== current && links?.[lang]);
  if (others.length === 0) return null;

  return (
    <nav
      aria-label={t(`label_${current}`)}
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm ${className}`}
    >
      <span className="text-gray-500 dark:text-gray-400">{t(`label_${current}`)}</span>
      {others.map((lang, i) => (
        <span key={lang} className="inline-flex items-baseline gap-2">
          {i > 0 && (
            <span aria-hidden="true" className="text-gray-300">
              ·
            </span>
          )}
          <Link
            href={links[lang]}
            hrefLang={lang === "pt" ? "pt" : lang}
            lang={lang}
            className="font-semibold text-[#BD0E0D] hover:underline"
          >
            {t(`name_${lang}`)}
          </Link>
        </span>
      ))}
    </nav>
  );
}

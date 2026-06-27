"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Banner de apoyo a la traducción, con la estética del DonationInlineBanner
 * (grilla de portadas de fondo + capa de marca #BD0E0D). Muestra el progreso
 * de traducción del dossier y dos llamadas a la acción: Digital ABO y Spenden.
 *
 * Props:
 *  - translatedCount: nº de artículos ya traducidos
 *  - totalCount: nº total de artículos del dossier
 *  - isDe: true si el locale es alemán
 */
export default function TranslationSupportBanner({
  translatedCount = 0,
  totalCount = 0,
  isDe = false,
}) {
  const [covers, setCovers] = useState([]);

  useEffect(() => {
    async function loadCovers() {
      try {
        const res = await fetch("/api/editions?limit=20");
        const data = await res.json();
        const coverImages = data.map((d) => d.coverImage).filter(Boolean);
        setCovers(coverImages.sort(() => Math.random() - 0.5));
      } catch (err) {
        console.error("Error loading covers:", err);
      }
    }
    loadCovers();
  }, []);

  const pct =
    totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0;

  const localePrefix = isDe ? "/de" : "/es";

  return (
    <aside
      className="my-12 not-prose"
      aria-label={isDe ? "Übersetzung unterstützen" : "Apoyá la traducción"}
    >
      <div
        className="relative overflow-hidden shadow-xl"
        style={{ backgroundColor: "#7a0908" }}
      >
        {/* Fondo: grid denso de portadas */}
        <div
          className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14 auto-rows-fr pointer-events-none"
          aria-hidden="true"
        >
          {covers.length > 0 &&
            [...Array(140)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] overflow-hidden"
                style={{ opacity: 0.85 + ((i * 17) % 15) / 100 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={covers[i % covers.length]}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: "blur(0.5px)" }}
                />
              </div>
            ))}
        </div>

        {/* Capa de marca */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: "#BD0E0D", opacity: 0.82 }}
          aria-hidden="true"
        />

        {/* Contenido */}
        <div className="relative px-5 sm:px-8 py-7 sm:py-8">
          {/* Logo "ila" */}
          <div className="flex items-center justify-center mb-5">
            <span
              style={{
                color: "#BD0E0D",
                backgroundColor: "#ffffff",
                fontFamily:
                  "var(--font-futura), 'Futura PT', Futura, sans-serif",
              }}
              className="shrink-0 inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-4xl font-bold leading-none shadow-md"
            >
              ila
            </span>
          </div>

          {/* Título: progreso */}
          <p
            role="heading"
            aria-level={3}
            style={{ color: "#ffffff" }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-center mb-1"
          >
            {isDe
              ? `${translatedCount} von ${totalCount} Beiträgen auf Spanisch`
              : `${translatedCount} de ${totalCount} artículos en español`}
          </p>

          {/* Barra de progreso */}
          <div className="max-w-md mx-auto mt-4 mb-1">
            <div
              className="h-2 w-full overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              <div
                className="h-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: "#ffffff" }}
              />
            </div>
            <p
              style={{ color: "#ffffff" }}
              className="text-xs uppercase tracking-widest font-bold text-center mt-2 opacity-90"
            >
              {pct}% {isDe ? "übersetzt" : "traducido"}
            </p>
          </div>

          {/* Descripción */}
          <p
            style={{ color: "#ffffff" }}
            className="text-base sm:text-lg font-light leading-snug text-center opacity-95 mb-6 max-w-2xl mx-auto"
          >
            {isDe
              ? "Unser Übersetzungsteam arbeitet an den übrigen Beiträgen. Das gesamte Archiv ins Spanische zu übertragen — über 8.000 Artikel — gelingt nur mit deiner Unterstützung."
              : "Nuestro equipo de traducción está trabajando en el resto. Llevar el archivo completo al español —más de 8.000 artículos— solo es posible con tu apoyo."}
          </p>

          {/* Botones: Digital ABO (primario) + Spenden (secundario) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              href={`${localePrefix}/order/abo`}
              style={{ color: "#BD0E0D", backgroundColor: "#ffffff" }}
              className="group inline-flex items-center justify-center gap-2 hover:bg-gray-50 font-bold text-sm sm:text-base px-6 py-3.5 shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 no-underline uppercase tracking-wide"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                style={{ color: "#BD0E0D" }}
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 4v10h16V8H4zm2 2h7v2H6v-2zm0 4h5v2H6v-2z" />
              </svg>
              <span style={{ color: "#BD0E0D" }}>
                {isDe ? "Digital-ABO" : "Suscripción Digital"}
              </span>
            </Link>

            <Link
              href={`${localePrefix}/support/donations`}
              style={{ color: "#ffffff", borderColor: "rgba(255,255,255,0.7)" }}
              className="group inline-flex items-center justify-center gap-2 border-2 hover:bg-white/10 font-bold text-sm sm:text-base px-6 py-3.5 transition-all duration-200 hover:-translate-y-0.5 no-underline uppercase tracking-wide"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span style={{ color: "#ffffff" }}>
                {isDe ? "Spenden" : "Donar"}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

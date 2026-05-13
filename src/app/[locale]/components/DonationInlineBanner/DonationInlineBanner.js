"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

/**
 * Banner inline de donación. Se inserta en medio del contenido del artículo.
 * Usa los mismos textos que el popup (namespace "donationPopup").
 * No se muestra a admins ni a usuarios con PDF-Abo activo.
 *
 * Diseño alineado al Brand Kit (ver CLAUDE.md):
 *  - Color primario #BD0E0D
 *  - Font marca "font-futura" para títulos
 *  - Esquinas rectas (sin border-radius)
 *  - Usa <p role="heading"> para evitar el color !important
 *    de .article-content h2/h3 definido en globals.css
 */
export default function DonationInlineBanner() {
  const { data: session, status } = useSession();
  const t = useTranslations("donationPopup");
  const [hasPdfAbo, setHasPdfAbo] = useState(false);
  const [pdfAboChecked, setPdfAboChecked] = useState(false);
  const [covers, setCovers] = useState([]);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.email) {
      setPdfAboChecked(true);
      return;
    }
    let aborted = false;
    fetch("/api/user/pdf-abo")
      .then((r) => r.json())
      .then((d) => {
        if (!aborted) {
          setHasPdfAbo(!!d?.hasPdfAbo);
          setPdfAboChecked(true);
        }
      })
      .catch(() => {
        if (!aborted) setPdfAboChecked(true);
      });
    return () => {
      aborted = true;
    };
  }, [session, status]);

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

  if (status === "loading" || !pdfAboChecked) return null;
  if (isAdmin || hasPdfAbo) return null;

  return (
    <aside
      className="my-12 not-prose"
      aria-label={t("title")}
    >
      <div
        className="relative overflow-hidden shadow-xl"
        style={{ backgroundColor: "#7a0908" }}
      >
        {/* Fondo: grid denso de portadas sin gap, llena todo el banner */}
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
                <img
                  src={covers[i % covers.length]}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ filter: "blur(0.5px)" }}
                />
              </div>
            ))}
        </div>

        {/* Capa de marca para legibilidad — color primario #BD0E0D */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: "#BD0E0D", opacity: 0.78 }}
          aria-hidden="true"
        />

        {/* Contenido — en filas */}
        <div className="relative px-5 sm:px-8 py-6 sm:py-7">
          {/* FILA 1: Logo + Badges centrados */}
          <div className="flex items-center justify-center gap-4 sm:gap-5 mb-6 flex-wrap">
            {/* Logo — caja "ila" cuadrada */}
            <span
              style={{
                color: "#BD0E0D",
                backgroundColor: "#ffffff",
                fontFamily: "var(--font-futura), 'Futura PT', Futura, sans-serif",
              }}
              className="shrink-0 inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl font-bold leading-none shadow-md"
            >
              ila
            </span>

            {/* Stats — badges horizontales */}
            <div className="flex shrink-0">
              {[
                ["50", t("years")],
                ["10×", t("yearly")],
                ["100%", t("independent")],
              ].map(([num, label], i) => (
                <div
                  key={label}
                  style={{
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.10)",
                    borderColor: "rgba(255,255,255,0.35)",
                  }}
                  className={`px-4 sm:px-5 py-2.5 border inline-flex flex-col items-center justify-center min-w-[80px] sm:min-w-[100px] ${
                    i > 0 ? "border-l-0" : ""
                  }`}
                >
                  <span
                    style={{
                      color: "#ffffff",
                      fontFamily: "var(--font-futura), 'Futura PT', Futura, sans-serif",
                    }}
                    className="text-xl sm:text-2xl font-bold leading-none"
                  >
                    {num}
                  </span>
                  <span
                    style={{ color: "#ffffff" }}
                    className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mt-1 opacity-90"
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* FILA 2: Título */}
          <p
            role="heading"
            aria-level={3}
            style={{ color: "#ffffff" }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-center mb-1"
          >
            {t("title")}
          </p>

          {/* FILA 3: Subtítulo (debajo del título) */}
          <p
            style={{ color: "#ffffff" }}
            className="text-base sm:text-lg md:text-xl font-light italic leading-snug text-center opacity-95 mb-4"
          >
            {t("subtitle")}
          </p>

          {/* FILA 4: Descripción */}
          <p
            style={{ color: "#ffffff" }}
            className="text-lg sm:text-xl md:text-2xl font-bold leading-snug text-center mb-5 max-w-2xl mx-auto"
          >
            {t("description")}
          </p>

          {/* FILA 5: Botón */}
          <div className="flex justify-center">
            <Link
              href="/support/donations"
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
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span style={{ color: "#BD0E0D" }}>{t("donateButton")}</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

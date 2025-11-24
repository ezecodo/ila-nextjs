"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

export default function DonationBanner({
  hideForRoles = ["admin", "editor", "reviewer", "translator"],
}) {
  const t = useTranslations("donationPopup");
  const { data: session, status } = useSession();

  // ⏳ Evitar parpadeo mientras se resuelve la sesión
  if (status === "loading") return null;

  // 🔒 Ocultar a roles internos
  const role = session?.user?.role;
  if (role && hideForRoles.includes(role)) return null;

  return (
    <div className="w-full bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-lg overflow-hidden my-8 relative">
      {/* Patrón decorativo de fondo */}
      <div className="absolute inset-0 opacity-10">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <pattern
            id="grid-banner"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
          <rect width="100" height="100" fill="url(#grid-banner)" />
        </svg>
      </div>

      <div className="relative p-6 sm:p-8 flex flex-col items-center text-center gap-4">
        {/* Logo y título */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Logo ila pequeño */}
          <div className="bg-white w-12 h-12 flex items-center justify-center shadow-lg flex-shrink-0">
            <span
              className="text-2xl font-bold text-red-600"
              style={{ fontFamily: "Futura, sans-serif" }}
            >
              ila
            </span>
          </div>

          {/* Texto principal */}
          <div className="text-white">
            <h3 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
              {t("title")}
            </h3>
            <p className="text-sm sm:text-base font-light opacity-90">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-white text-base sm:text-lg font-medium max-w-2xl">
          {t("description")}
        </p>

        {/* Botón */}
        <Link
          href="/support/donations"
          className="group bg-white text-red-600 font-bold px-6 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
        >
          <svg
            className="w-5 h-5 group-hover:scale-110 transition-transform"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {t("donateButton")}
        </Link>

        {/* Mensaje pequeño */}
        <p className="text-white/80 text-xs sm:text-sm">{t("trustMessage")}</p>
      </div>
    </div>
  );
}

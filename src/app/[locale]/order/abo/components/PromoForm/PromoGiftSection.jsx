"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function InputField({ label, required, error, ...props }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2.5 rounded-lg border ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-600 focus:border-red-500 focus:ring-red-500"
        } bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all`}
      />
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// 🎁 Solo el banner informativo
export function PromoBanner() {
  const t = useTranslations("abo.promo");

  return (
    <div className="mb-6 relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-red-700 to-red-800 dark:from-red-800 dark:to-red-900 shadow-2xl">
      {/* Patrón de fondo sutil */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="relative px-4 md:px-8 py-5 md:py-8">
        {/* Título pequeño */}
        <div className="text-red-100 text-xs md:text-sm font-semibold uppercase tracking-wider mb-3">
          {t("title")}
        </div>

        {/* BENEFICIO PRINCIPAL */}
        <div className="bg-white/95 dark:bg-gray-900/95 rounded-lg md:rounded-xl px-4 md:px-6 py-4 md:py-5 mb-4 md:mb-5 shadow-xl">
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <div className="flex-shrink-0 mt-1 md:mt-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 md:h-12 md:w-12 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {t("gift")}
            </p>
          </div>
        </div>

        {/* Detalles/Condiciones */}
        <p className="text-white/90 text-sm md:text-base leading-relaxed mb-3 md:mb-4">
          {t("conditions")}
        </p>

        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 md:h-4 md:w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{t("deadline")}</span>
        </div>
      </div>
    </div>
  );
}
// 🎁 Banner horizontal para Landing Page
export function PromoHeroBanner({ editions = [] }) {
  const t = useTranslations("abo.promo");

  return (
    <div className="mb-0 relative overflow-hidden rounded-lg md:rounded-none bg-gradient-to-br from-red-700 to-red-800 dark:from-red-800 dark:to-red-900 shadow-md">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="relative px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          {/* 🎁 LOGO ILA */}
          <div className="bg-white rounded-sm w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-lg">
            <span
              className="text-3xl md:text-4xl font-bold text-red-800"
              style={{ fontFamily: "Futura, sans-serif" }}
            >
              ila
            </span>
          </div>
          <div className="flex-1">
            <div className="text-red-100 text-xs md:text-sm font-semibold uppercase tracking-wider mb-2">
              {t("title")}
            </div>
            <h3 className="text-white text-xl md:text-3xl font-bold leading-tight mb-2">
              {t("gift")}
            </h3>
            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              {t("conditions")}
            </p>
          </div>
          {/* 📚 Abanico decorativo de portadas */}
          {editions.length >= 3 && (
            <div className="hidden lg:flex flex-shrink-0 relative h-32 w-40">
              {/* Portada 3 (atrás) */}
              <div className="absolute top-0 left-0 w-24 h-34 rounded-sm shadow-lg transform -rotate-12 opacity-80 overflow-hidden border-2 border-white">
                <Image
                  src={editions[2].coverImage}
                  alt={editions[2].title}
                  width={80}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
              {/* Portada 2 (medio) */}
              <div className="absolute top-0 left-6 w-20 h-28 rounded-sm shadow-xl transform rotate-0 opacity-90 overflow-hidden border-2 border-white">
                <Image
                  src={editions[1].coverImage}
                  alt={editions[1].title}
                  width={80}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
              {/* Portada 1 (frente) */}
              <div className="absolute -top-2 left-12 w-20 h-28 rounded-sm shadow-2xl transform rotate-12 overflow-hidden border-2 border-white">
                <Image
                  src={editions[0].coverImage}
                  alt={editions[0].title}
                  width={80}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
          <Link href="/order/abo" className="flex-shrink-0">
            <div className="bg-white/95 dark:bg-gray-900/95 rounded-lg px-4 md:px-6 py-3 md:py-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-red-500 group">
              <div className="flex items-center gap-2">
                <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t("deadline")}
                </p>
                <span className="text-red-600 group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
// 📝 Solo el formulario de destinatario
export default function PromoGiftForm({ form, handleChange }) {
  const t = useTranslations("abo.promo");

  // Solo mostrar si es Normal o Supporter
  if (form.type !== "NORMAL" && form.type !== "SUPPORTER") {
    return null;
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Formulario directo - siempre visible */}
        <div className="p-5 border border-red-200 dark:border-red-700 rounded-xl bg-red-50 dark:bg-red-900/30 transition-all duration-300 ease-in-out">
          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span>🎁</span>
            {t("recipientTitle")}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("name")}
              type="text"
              placeholder={t("namePlaceholder")}
              value={form.promoGiftRecipientName}
              onChange={(e) =>
                handleChange("promoGiftRecipientName", e.target.value)
              }
              required
            />

            <InputField
              label={t("email")}
              type="email"
              placeholder={t("emailPlaceholder")}
              value={form.promoGiftRecipientEmail}
              onChange={(e) =>
                handleChange("promoGiftRecipientEmail", e.target.value)
              }
            />

            <InputField
              label={t("street")}
              type="text"
              placeholder={t("streetPlaceholder")}
              value={form.promoGiftRecipientStreet}
              onChange={(e) =>
                handleChange("promoGiftRecipientStreet", e.target.value)
              }
              required
            />

            <InputField
              label={t("zip")}
              type="text"
              placeholder={t("zipPlaceholder")}
              value={form.promoGiftRecipientZip}
              onChange={(e) =>
                handleChange("promoGiftRecipientZip", e.target.value)
              }
              required
            />

            <InputField
              label={t("city")}
              type="text"
              placeholder={t("cityPlaceholder")}
              value={form.promoGiftRecipientCity}
              onChange={(e) =>
                handleChange("promoGiftRecipientCity", e.target.value)
              }
              required
            />

            <InputField
              label={t("country")}
              type="text"
              placeholder={t("countryPlaceholder")}
              value={form.promoGiftRecipientCountry}
              onChange={(e) =>
                handleChange("promoGiftRecipientCountry", e.target.value)
              }
            />
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            ℹ️ {t("durationNote")}
          </p>
        </div>
      </div>
    </Card>
  );
}

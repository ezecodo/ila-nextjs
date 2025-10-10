"use client";

import { useTranslations, useLocale } from "next-intl";

export default function TermsCheckboxes({ form, handleChange }) {
  const t = useTranslations("abo");
  const locale = useLocale(); // 👈 idioma actual ("es" o "de")

  const privacyLink = locale === "es" ? "/es/datenschutz" : "/datenschutz";
  const termsLink = locale === "es" ? "/es/agb" : "/agb";

  return (
    <div
      key={locale}
      className="space-y-4 p-6 border rounded-xl bg-white dark:bg-gray-800"
    >
      {/* Términos y condiciones */}
      <label className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
        <input
          type="checkbox"
          checked={form.termsAccepted}
          onChange={(e) => handleChange("termsAccepted", e.target.checked)}
          className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <span
          dangerouslySetInnerHTML={{
            __html: t.raw("termsCheckbox").replaceAll("/agb", termsLink), // 👈 ajusta link por idioma
          }}
        />
      </label>

      {/* Derecho de desistimiento */}
      <label className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
        <input
          type="checkbox"
          checked={form.withdrawalAccepted}
          onChange={(e) => handleChange("withdrawalAccepted", e.target.checked)}
          className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <span>{t("withdrawalCheckbox")}</span>
      </label>

      {/* Política de privacidad */}
      <label className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
        <input
          type="checkbox"
          checked={form.dataConsentAccepted}
          onChange={(e) =>
            handleChange("dataConsentAccepted", e.target.checked)
          }
          className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <span
          dangerouslySetInnerHTML={{
            __html: t
              .raw("privacyCheckbox")
              .replaceAll("/datenschutz", privacyLink), // 👈 ajusta link por idioma
          }}
        />
      </label>
    </div>
  );
}

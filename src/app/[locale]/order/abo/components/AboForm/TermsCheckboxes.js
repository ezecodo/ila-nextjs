"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useRef, useEffect } from "react";
import AgbModal from "./AgbModal";
import DatenschutzModal from "./DatenschutzModal"; // 👈 Importar el nuevo modal

export default function TermsCheckboxes({ form, handleChange }) {
  const t = useTranslations("abo");
  const locale = useLocale();

  const [isAgbModalOpen, setIsAgbModalOpen] = useState(false);
  const [isDatenschutzModalOpen, setIsDatenschutzModalOpen] = useState(false); // 👈 Estado para el modal de privacidad

  const termsRef = useRef(null);
  const privacyRef = useRef(null); // 👈 Ref para el label de privacidad

  const privacyLink = locale === "es" ? "/es/datenschutz" : "/datenschutz";
  const termsLink = locale === "es" ? "/es/agb" : "/agb";

  // Interceptar clics en el enlace de AGB
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.tagName === "A" && e.target.href.includes("/agb")) {
        e.preventDefault();
        setIsAgbModalOpen(true);
      }
    };

    const element = termsRef.current;
    if (element) {
      element.addEventListener("click", handleClick);
      return () => element.removeEventListener("click", handleClick);
    }
  }, []);

  // Interceptar clics en el enlace de Datenschutz
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.tagName === "A" && e.target.href.includes("/datenschutz")) {
        e.preventDefault();
        setIsDatenschutzModalOpen(true);
      }
    };

    const element = privacyRef.current;
    if (element) {
      element.addEventListener("click", handleClick);
      return () => element.removeEventListener("click", handleClick);
    }
  }, []);

  return (
    <>
      <div
        key={locale}
        className="space-y-4 p-6 border bg-white dark:bg-gray-800"
      >
        {/* Términos y condiciones */}
        <label
          ref={termsRef}
          className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200"
        >
          <input
            type="checkbox"
            checked={form.termsAccepted}
            onChange={(e) => handleChange("termsAccepted", e.target.checked)}
            className="mt-1 w-4 h-4 text-[color:var(--abo-accent)] border-gray-300 rounded focus:ring-[color:var(--abo-accent)]"
          />
          <span
            dangerouslySetInnerHTML={{
              __html: t
                .raw("termsCheckbox")
                .replaceAll("/agb", termsLink)
                .replaceAll("text-red-600", "text-[color:var(--abo-accent)]"),
            }}
          />
        </label>

        {/* Derecho de desistimiento */}
        <label className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200">
          <input
            type="checkbox"
            checked={form.withdrawalAccepted}
            onChange={(e) =>
              handleChange("withdrawalAccepted", e.target.checked)
            }
            className="mt-1 w-4 h-4 text-[color:var(--abo-accent)] border-gray-300 rounded focus:ring-[color:var(--abo-accent)]"
          />
          <span>{t("withdrawalCheckbox")}</span>
        </label>

        {/* Política de privacidad */}
        <label
          ref={privacyRef} // 👈 Agregar ref aquí
          className="flex items-start gap-3 text-sm text-gray-800 dark:text-gray-200"
        >
          <input
            type="checkbox"
            checked={form.dataConsentAccepted}
            onChange={(e) =>
              handleChange("dataConsentAccepted", e.target.checked)
            }
            className="mt-1 w-4 h-4 text-[color:var(--abo-accent)] border-gray-300 rounded focus:ring-[color:var(--abo-accent)]"
          />
          <span
            dangerouslySetInnerHTML={{
              __html: t
                .raw("privacyCheckbox")
                .replaceAll("/datenschutz", privacyLink)
                .replaceAll("text-red-600", "text-[color:var(--abo-accent)]"),
            }}
          />
        </label>
      </div>

      {/* Modal de AGB */}
      <AgbModal
        open={isAgbModalOpen}
        onClose={() => setIsAgbModalOpen(false)}
      />

      {/* Modal de Datenschutz */}
      <DatenschutzModal
        open={isDatenschutzModalOpen}
        onClose={() => setIsDatenschutzModalOpen(false)}
      />
    </>
  );
}

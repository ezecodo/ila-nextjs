"use client";

export default function TermsCheckboxes({ form, handleChange }) {
  return (
    <div className="space-y-3 mt-6">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={form.termsAccepted}
          onChange={(e) => handleChange("termsAccepted", e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">
          Acepto los{" "}
          <a href="/terms" target="_blank" className="text-red-600 underline">
            Términos y Condiciones
          </a>
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={form.withdrawalAccepted}
          onChange={(e) => handleChange("withdrawalAccepted", e.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">
          Confirmo que he sido informado sobre mi derecho de desistimiento.
        </span>
      </label>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={form.dataConsentAccepted}
          onChange={(e) =>
            handleChange("dataConsentAccepted", e.target.checked)
          }
          className="mt-1"
        />
        <span className="text-sm">
          Doy mi consentimiento para el tratamiento de mis datos personales
          conforme a la{" "}
          <a href="/privacy" target="_blank" className="text-red-600 underline">
            política de privacidad
          </a>
          .
        </span>
      </label>
    </div>
  );
}

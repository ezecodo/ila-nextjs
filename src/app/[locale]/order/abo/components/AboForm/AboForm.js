"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import GiftSelector from "./GiftSelector";
import TermsCheckboxes from "./TermsCheckboxes";

function InfoBox({ children }) {
  return (
    <div className="rounded-xl border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4 text-red-900 dark:text-red-100 whitespace-pre-line text-sm sm:text-base">
      {children}
    </div>
  );
}

export default function AboForm({ gifts }) {
  const t = useTranslations("abo");

  const [form, setForm] = useState({
    type: "NORMAL",
    format: "PRINT",
    firstName: "",
    lastName: "",
    street: "",
    zip: "",
    city: "",
    country: "",
    email: "",
    giftId: null,
    donationExtra: "",
    trialVariant: "NORMAL",
    isGift: false, // 👈 nuevo campo
    termsAccepted: false,
    withdrawalAccepted: false,
    dataConsentAccepted: false,
  });

  const [supporterOpen, setSupporterOpen] = useState(false);
  const [donationError, setDonationError] = useState("");

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (form.type === "NORMAL_PDF" && form.format !== "PDF") {
      setForm((prev) => ({ ...prev, format: "PDF" }));
    }
    if (form.type !== "SUPPORTER") {
      setDonationError("");
      setSupporterOpen(false);
      if (form.donationExtra) {
        setForm((prev) => ({ ...prev, donationExtra: "" }));
      }
    }
    if (form.type !== "TRIAL" && form.trialVariant) {
      setForm((prev) => ({ ...prev, trialVariant: "NORMAL" }));
    }
  }, [form.type]);

  const onDonationChange = (val) => {
    if (val === "") {
      setDonationError("");
      handleChange("donationExtra", "");
      return;
    }
    if (!/^\d+$/.test(val)) {
      setDonationError(t("details.supporter.amountInteger"));
      handleChange("donationExtra", val);
      return;
    }
    const num = parseInt(val, 10);
    if (num < 10) {
      setDonationError(t("details.supporter.amountMinError"));
    } else {
      setDonationError("");
    }
    handleChange("donationExtra", val);
  };

  const canSubmit = useMemo(() => {
    if (form.type === "SUPPORTER") {
      if (!form.donationExtra || donationError) return false;
    }
    if (form.type === "TRIAL") {
      if (!["NORMAL", "REDUCED"].includes(form.trialVariant)) return false;
    }
    if (
      !form.termsAccepted ||
      !form.withdrawalAccepted ||
      !form.dataConsentAccepted
    )
      return false;
    if (
      !form.firstName ||
      !form.lastName ||
      !form.street ||
      !form.zip ||
      !form.city ||
      !form.email
    ) {
      return false;
    }
    return true;
  }, [form, donationError]);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      donationExtra:
        form.type === "SUPPORTER" && form.donationExtra && !donationError
          ? parseInt(form.donationExtra, 10)
          : null,
    };

    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      next: { revalidate: 0 },
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ Suscripción enviada correctamente!");
      setForm({
        type: "NORMAL",
        format: "PRINT",
        firstName: "",
        lastName: "",
        street: "",
        zip: "",
        city: "",
        country: "",
        email: "",
        giftId: null,
        donationExtra: "",
        trialVariant: "NORMAL",
        isGift: false,
        termsAccepted: false,
        withdrawalAccepted: false,
        dataConsentAccepted: false,
      });
      setSupporterOpen(false);
      setDonationError("");
    } else {
      alert("❌ Error al enviar suscripción.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Tipo de Abo */}
      <div>
        <label className="font-semibold block mb-1">{t("type")}</label>
        <select
          value={form.type}
          onChange={(e) => handleChange("type", e.target.value)}
          className="block w-full border p-2 rounded"
        >
          <option value="NORMAL">{t("normal")}</option>
          <option value="NORMAL_PDF">{t("normal_pdf")}</option>
          <option value="SUPPORTER">{t("supporter")}</option>
          <option value="REDUCED">{t("reduced")}</option>
          <option value="TRIAL">{t("trial")}</option>
        </select>
      </div>

      {/* Abo verschenken (no se muestra en ProbeAbo) */}
      {form.type !== "TRIAL" && (
        <div>
          <label className="font-semibold block mb-2">Abo verschenken?</label>
          <div className="flex gap-6">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="isGift"
                value="true"
                checked={form.isGift === true}
                onChange={() => handleChange("isGift", true)}
              />
              <span>Ja</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="isGift"
                value="false"
                checked={form.isGift === false}
                onChange={() => handleChange("isGift", false)}
              />
              <span>Nein</span>
            </label>
          </div>
        </div>
      )}

      {/* Info dinámica por tipo */}
      {form.type === "NORMAL_PDF" && (
        <InfoBox>{t("details.normal_pdf.text")}</InfoBox>
      )}

      {form.type === "SUPPORTER" && (
        <div className="space-y-3">
          <InfoBox>{t("details.supporter.intro")}</InfoBox>

          <button
            type="button"
            onClick={() => setSupporterOpen((v) => !v)}
            className="text-sm underline text-red-700 dark:text-red-300"
          >
            {t("details.supporter.adjustToggle")}
          </button>

          {supporterOpen && (
            <div className="space-y-3">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {t("details.supporter.adjustText")}
              </p>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("details.supporter.amountLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.donationExtra}
                    onChange={(e) => onDonationChange(e.target.value)}
                    placeholder="10"
                    className="border p-2 rounded w-28 text-right"
                  />
                  <span>€</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("details.supporter.amountHint")}
                </p>
                {donationError && (
                  <p className="text-xs text-red-600 mt-1">{donationError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {form.type === "REDUCED" && (
        <InfoBox>{t("details.reduced.info")}</InfoBox>
      )}

      {form.type === "TRIAL" && (
        <div className="space-y-3">
          <InfoBox>{t("details.trial.info")}</InfoBox>

          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="trialVariant"
                value="NORMAL"
                checked={form.trialVariant === "NORMAL"}
                onChange={(e) => handleChange("trialVariant", e.target.value)}
              />
              <span>{t("details.trial.variantNormal")}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="trialVariant"
                value="REDUCED"
                checked={form.trialVariant === "REDUCED"}
                onChange={(e) => handleChange("trialVariant", e.target.value)}
              />
              <span>{t("details.trial.variantReduced")}</span>
            </label>
          </div>
        </div>
      )}

      {/* Datos personales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder={t("firstName")}
          value={form.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder={t("lastName")}
          value={form.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder={t("street")}
          value={form.street}
          onChange={(e) => handleChange("street", e.target.value)}
          className="border p-2 rounded md:col-span-2"
          required
        />
        <input
          type="text"
          placeholder={t("zip")}
          value={form.zip}
          onChange={(e) => handleChange("zip", e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder={t("city")}
          value={form.city}
          onChange={(e) => handleChange("city", e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="E-Mail"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          className="border p-2 rounded md:col-span-2"
          required
        />
      </div>

      <GiftSelector
        gifts={gifts}
        onSelect={(id) => handleChange("giftId", id)}
      />

      <TermsCheckboxes form={form} handleChange={handleChange} />

      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full py-3 rounded-lg transition ${
          canSubmit
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        {t("submit")}
      </button>
    </form>
  );
}

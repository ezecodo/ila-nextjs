"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import GiftSelector from "./GiftSelector";
import TermsCheckboxes from "./TermsCheckboxes";
import PromoGiftForm, { PromoBanner } from "../PromoForm/PromoGiftSection";
function InfoBox({ children }) {
  return (
    <div className="rounded-xl border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 p-5 text-red-900 dark:text-red-100 whitespace-pre-line text-sm sm:text-base shadow-sm">
      {children}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
function SectionTitle({ children }) {
  return (
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
      <span className="w-1 h-6 bg-red-500 rounded-full"></span>
      {children}
    </h3>
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

function RadioButton({ label, ...props }) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
      <input
        type="radio"
        {...props}
        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 focus:ring-2"
      />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
        {label}
      </span>
    </label>
  );
}

export default function AboForm({ gifts }) {
  const t = useTranslations("abo");

  const [form, setForm] = useState({
    type: "NORMAL",
    format: "PRINT",
    salutation: "",
    institution: "",
    addressExtra: "",
    firstName: "",
    lastName: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    phone: "",
    email: "",
    giftId: null,
    donationExtra: "",
    trialVariant: "NORMAL",
    isGift: false,
    giftRecipientName: "",
    giftRecipientEmail: "",
    giftRecipientStreet: "",
    giftRecipientZip: "",
    giftRecipientCity: "",
    giftRecipientCountry: "Deutschland",
    giftSubscriptionDuration: "ONE_YEAR",
    termsAccepted: false,
    withdrawalAccepted: false,
    dataConsentAccepted: false,
    promoGiftEnabled: false,
    promoGiftRecipientName: "",
    promoGiftRecipientEmail: "",
    promoGiftRecipientStreet: "",
    promoGiftRecipientZip: "",
    promoGiftRecipientCity: "",
    promoGiftRecipientCountry: "Deutschland",
  });
  const [activeBanner, setActiveBanner] = useState(null);

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
  useEffect(() => {
    async function fetchActiveBanner() {
      try {
        const res = await fetch("/api/banners?position=top");
        const data = await res.json();
        if (data && data.length > 0) {
          setActiveBanner(data[0]);
        }
      } catch (err) {
        console.error("Error loading banner:", err);
      }
    }
    fetchActiveBanner();
  }, []);

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
    // Validar datos del Probe Abo de promoción
    if (form.promoGiftEnabled) {
      if (
        !form.promoGiftRecipientName ||
        !form.promoGiftRecipientStreet ||
        !form.promoGiftRecipientZip ||
        !form.promoGiftRecipientCity
      ) {
        return false;
      }
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
      giftSubscriptionDuration: form.isGift
        ? form.giftSubscriptionDuration
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
        salutation: "",
        institution: "",
        addressExtra: "",
        firstName: "",
        lastName: "",
        street: "",
        zip: "",
        city: "",
        country: "Deutschland",
        phone: "",
        email: "",
        giftId: null,
        donationExtra: "",
        trialVariant: "NORMAL",
        isGift: false,
        giftRecipientName: "",
        giftRecipientEmail: "",
        giftRecipientStreet: "",
        giftRecipientZip: "",
        giftRecipientCity: "",
        giftRecipientCountry: "Deutschland",
        giftDelivery: "to_payer",
        termsAccepted: false,
        withdrawalAccepted: false,
        dataConsentAccepted: false,
        promoGiftEnabled: false,
        promoGiftRecipientName: "",
        promoGiftRecipientEmail: "",
        promoGiftRecipientStreet: "",
        promoGiftRecipientZip: "",
        promoGiftRecipientCity: "",
        promoGiftRecipientCountry: "Deutschland",
      });
      setSupporterOpen(false);
      setDonationError("");
    } else {
      alert("❌ Error al enviar suscripción.");
    }
  }

  const plans = [
    { type: "NORMAL",      nameKey: "normalName",     priceKey: "normalPrice",     descKey: "normalDesc",     popular: true  },
    { type: "NORMAL_PDF",  nameKey: "normalPdfName",  priceKey: "normalPdfPrice",  descKey: "normalPdfDesc"                  },
    { type: "SUPPORTER",   nameKey: "supporterName",  priceKey: "supporterPrice",  descKey: "supporterDesc"                  },
    { type: "REDUCED",     nameKey: "reducedName",    priceKey: "reducedPrice",    descKey: "reducedDesc"                    },
    { type: "TRIAL",       nameKey: "trialName",      priceKey: "trialPrice",      descKey: "trialDesc"                      },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pt-6">
      {/* ── Tipo de Suscripción — Pricing cards ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
          {t("type")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {plans.map((plan) => {
            const active = form.type === plan.type;
            return (
              <button
                key={plan.type}
                type="button"
                onClick={() => handleChange("type", plan.type)}
                className={`relative flex flex-col p-3 rounded-xl border-2 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#BD0E0D] ${
                  active
                    ? "border-[#BD0E0D] bg-red-50 dark:bg-red-900/20 shadow-md"
                    : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-gray-800"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-3 bg-[#BD0E0D] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                    {t("popularLabel")}
                  </span>
                )}
                <span className={`text-[11px] font-black uppercase tracking-wide leading-tight mb-1 ${active ? "text-[#BD0E0D]" : "text-gray-500 dark:text-gray-400"}`}>
                  {t(plan.nameKey)}
                </span>
                <span className={`text-base font-black leading-none mb-1.5 ${active ? "text-[#BD0E0D]" : "text-gray-900 dark:text-gray-100"}`}>
                  {t(plan.priceKey)}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                  {t(plan.descKey)}
                </span>
                {active && (
                  <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#BD0E0D] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info dinámica — justo debajo de las pricing cards */}
      {form.type === "NORMAL" && (
        <InfoBox>{t("details.normal.info")}</InfoBox>
      )}

      {form.type === "NORMAL_PDF" && (
        <InfoBox>
          <div
            dangerouslySetInnerHTML={{
              __html: t.raw("details.normal_pdf.text"),
            }}
          />
        </InfoBox>
      )}

      {form.type === "SUPPORTER" && (
        <Card>
          <InfoBox>{t("details.supporter.intro")}</InfoBox>

          <button
            type="button"
            onClick={() => setSupporterOpen((v) => !v)}
            className="mt-4 text-sm font-medium underline text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            {t("details.supporter.adjustToggle")}
          </button>

          {supporterOpen && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {t("details.supporter.adjustText")}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("details.supporter.amountLabel")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.donationExtra}
                    onChange={(e) => onDonationChange(e.target.value)}
                    placeholder="10"
                    className="border border-gray-300 dark:border-gray-600 p-2.5 rounded-lg w-32 text-right bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    €
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {t("details.supporter.amountHint")}
                </p>
                {donationError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                    {donationError}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {form.type === "REDUCED" && (
        <InfoBox>{t("details.reduced.info")}</InfoBox>
      )}

      {form.type === "TRIAL" && (
        <Card>
          <InfoBox>{t("details.trial.info")}</InfoBox>

          <div className="mt-4 space-y-3">
            <RadioButton
              label={t("details.trial.variantNormal")}
              name="trialVariant"
              value="NORMAL"
              checked={form.trialVariant === "NORMAL"}
              onChange={(e) => handleChange("trialVariant", e.target.value)}
            />
            <RadioButton
              label={t("details.trial.variantReduced")}
              name="trialVariant"
              value="REDUCED"
              checked={form.trialVariant === "REDUCED"}
              onChange={(e) => handleChange("trialVariant", e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* ── Card que contiene el ¿regalo? ── */}
      {form.type !== "TRIAL" && (
      <Card>

        {/* Regalo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t("giftQuestion")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <RadioButton
              label={t("giftYes")}
              name="isGift"
              value="true"
              checked={form.isGift === true}
              onChange={() => handleChange("isGift", true)}
            />
            <RadioButton
              label={t("giftNo")}
              name="isGift"
              value="false"
              checked={form.isGift === false}
              onChange={() => handleChange("isGift", false)}
            />
          </div>
        </div>
        {form.isGift && (
          <div className="mt-6 p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30 transition-all duration-300 ease-in-out">
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {t("giftRecipientTitle")}
            </h4>
            {/* Laufzeit */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("giftDurationLabel")}
              </label>
              <select
                value={form.giftSubscriptionDuration}
                onChange={(e) =>
                  handleChange("giftSubscriptionDuration", e.target.value)
                }
                className="border border-gray-300 dark:border-gray-600 p-2.5 rounded-lg w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="ONE_YEAR">{t("giftDurationOneYear")}</option>
                <option value="UNTIL_CANCELLED">
                  {t("giftDurationUntilCancelled")}
                </option>
              </select>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {t("giftDurationInfo")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label={t("giftRecipientName")}
                type="text"
                placeholder={t("giftRecipientName")}
                value={form.giftRecipientName}
                onChange={(e) =>
                  handleChange("giftRecipientName", e.target.value)
                }
                required
              />

              <InputField
                label={t("giftRecipientEmail")}
                type="email"
                placeholder={t("giftRecipientEmail")}
                value={form.giftRecipientEmail}
                onChange={(e) =>
                  handleChange("giftRecipientEmail", e.target.value)
                }
              />

              <InputField
                label={t("giftRecipientStreet")}
                type="text"
                placeholder={t("giftRecipientStreet")}
                value={form.giftRecipientStreet}
                onChange={(e) =>
                  handleChange("giftRecipientStreet", e.target.value)
                }
              />

              <InputField
                label={t("giftRecipientZip")}
                type="text"
                placeholder={t("giftRecipientZip")}
                value={form.giftRecipientZip}
                onChange={(e) =>
                  handleChange("giftRecipientZip", e.target.value)
                }
              />

              <InputField
                label={t("giftRecipientCity")}
                type="text"
                placeholder={t("giftRecipientCity")}
                value={form.giftRecipientCity}
                onChange={(e) =>
                  handleChange("giftRecipientCity", e.target.value)
                }
              />

              <InputField
                label={t("giftRecipientCountry")}
                type="text"
                placeholder={t("giftRecipientCountry")}
                value={form.giftRecipientCountry}
                onChange={(e) =>
                  handleChange("giftRecipientCountry", e.target.value)
                }
              />
            </div>
          </div>
        )}
      </Card>
      )}

      {/* 🎁 Banner y Formulario de Promo - Solo si hay banner activo con promo Y es Normal/Supporter */}
      {activeBanner?.hasPromoForm &&
        (form.type === "NORMAL" || form.type === "SUPPORTER") && (
          <>
            <PromoBanner />
            <PromoGiftForm form={form} handleChange={handleChange} />
          </>
        )}
      {/* Datos Personales */}
      <Card>
        <SectionTitle>
          {form.isGift ? t("payerTitle") : t("personalDataTitle")}
        </SectionTitle>
        <div className="space-y-4">
          {/* Primera fila: Saludo, Nombre, Apellido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("salutation")}
              </label>
              <select
                value={form.salutation}
                onChange={(e) => handleChange("salutation", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="">{t("salutation_none")}</option>
                <option value="Herr">{t("mr")}</option>
                <option value="Frau">{t("mrs")}</option>
                <option value="Divers">{t("diverse")}</option>
              </select>
            </div>

            <InputField
              label={t("firstName")}
              type="text"
              placeholder={t("firstName")}
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />

            <InputField
              label={t("lastName")}
              type="text"
              placeholder={t("lastName")}
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              required
            />
          </div>

          {/* Segunda fila: Institución y Dirección extra */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("institution")}
              type="text"
              placeholder={t("institution")}
              value={form.institution}
              onChange={(e) => handleChange("institution", e.target.value)}
            />

            <InputField
              label={t("addressExtra")}
              type="text"
              placeholder={t("addressExtra")}
              value={form.addressExtra}
              onChange={(e) => handleChange("addressExtra", e.target.value)}
            />
          </div>

          {/* Tercera fila: Calle y Código Postal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("street")}
              type="text"
              placeholder={t("street")}
              value={form.street}
              onChange={(e) => handleChange("street", e.target.value)}
              required
            />

            <InputField
              label={t("zip")}
              type="text"
              placeholder={t("zip")}
              value={form.zip}
              onChange={(e) => handleChange("zip", e.target.value)}
              required
            />
          </div>

          {/* Cuarta fila: Ciudad y País */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("city")}
              type="text"
              placeholder={t("city")}
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              required
            />

            <InputField
              label={t("country")}
              type="text"
              placeholder={t("country")}
              value={form.country}
              onChange={(e) => handleChange("country", e.target.value)}
            />
          </div>

          {/* Quinta fila: Teléfono y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label={t("phone")}
              type="tel"
              placeholder={t("phone")}
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />

            <InputField
              label={t("email")}
              type="email"
              placeholder={t("email")}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>
        </div>
      </Card>

      {/* Regalo y Términos */}
      {form.type !== "TRIAL" && (
        <GiftSelector
          gifts={gifts}
          selectedGiftId={form.giftId}
          onSelect={(giftId) => handleChange("giftId", giftId)}
          giftDelivery={form.giftDelivery}
          onDeliveryChange={(value) => handleChange("giftDelivery", value)}
        />
      )}

      <Card>
        <TermsCheckboxes form={form} handleChange={handleChange} />
      </Card>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={`w-full py-4 rounded-xl font-semibold text-base transition-all transform ${
          canSubmit
            ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        }`}
      >
        {t("submit")}
      </button>
    </form>
  );
}

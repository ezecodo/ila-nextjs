"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import countries from "i18n-iso-countries";
import de from "i18n-iso-countries/langs/de.json";
import es from "i18n-iso-countries/langs/es.json";

countries.registerLocale(de);
countries.registerLocale(es);

export default function OrderForm({
  selectedNormal = [],
  selectedOffers = [],
  recipients = [],
  splits = {},
}) {
  const [successMessage, setSuccessMessage] = useState(null);
  const t = useTranslations("orderForm");
  const locale = useLocale();

  const [formData, setFormData] = useState({
    salutation: "",
    firstName: "",
    lastName: "",
    institution: "",
    street: "",
    addressExtra: "",
    zip: "",
    city: "",
    country: locale === "de" ? "Deutschland" : "España",
    phone: "",
    email: "",
    message: "",
    privacy: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.privacy) {
      alert(t("privacyRequired"));
      return;
    }

    // Validar campos de cada destinatario activo
    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (
        !r.firstName ||
        !r.lastName ||
        !r.street ||
        !r.zip ||
        !r.city ||
        !r.country
      ) {
        alert(t("errorRecipientFields", { n: i + 1 }));
        return;
      }
    }

    // Expandir items según los splits (cada destinatario → un OrderItem)
    const cartEntries = [
      ...selectedNormal.map((item) => ({ key: `normal-${item.id}`, item })),
      ...selectedOffers.map((item) => ({ key: `offer-${item.id}`, item })),
    ];

    const items = [];
    for (const { key, item } of cartEntries) {
      const split = splits[key];
      if (!split) {
        // sin split → todo al comprador
        items.push({
          editionId: Number(item.id),
          qty: item.qty,
          recipientIndex: null,
        });
        continue;
      }
      for (const [idxStr, q] of Object.entries(split)) {
        if (!q || q <= 0) continue;
        const idx = Number(idxStr);
        items.push({
          editionId: Number(item.id),
          qty: q,
          recipientIndex: idx >= 0 ? idx : null,
        });
      }
    }

    // Verificar que cada destinatario activo tenga al menos 1 unidad asignada
    for (let i = 0; i < recipients.length; i++) {
      const hasAssignment = items.some((it) => it.recipientIndex === i);
      if (!hasAssignment) {
        alert(t("errorRecipientNoItems", { n: i + 1 }));
        return;
      }
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
          recipients,
          locale,
        }),
      });

      if (!res.ok) throw new Error("❌ Error al crear el pedido");

      const data = await res.json();
      console.log("✅ Pedido creado:", data);
      setSuccessMessage(
        locale === "de"
          ? "🎉 Vielen Dank! Ihr Auftrag wurde erfolgreich übermittelt. Sie erhalten in Kürze eine Bestätigungs-E-Mail und wir bearbeiten Ihre Bestellung schnellstmöglich."
          : "🎉 ¡Muchas gracias! Tu pedido ha sido enviado correctamente. Recibirás en breve un correo de confirmación y procesaremos tu pedido a la brevedad."
      );
    } catch (error) {
      console.error(error);
      alert("❌ Hubo un problema con tu pedido");
    }
  };

  return (
    <div>
      {successMessage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-bold text-green-700 mb-4">
              🎉{" "}
              {locale === "de"
                ? "Bestellung erfolgreich!"
                : "¡Pedido realizado!"}
            </h3>
            <p className="text-gray-700 mb-6">{successMessage}</p>
            <button
              onClick={() => {
                setSuccessMessage(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <form
        id="orderForm"
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto bg-white dark:bg-gray-900 shadow-md rounded-lg p-6 space-y-4 dark:text-gray-200"
      >
        <h2 className="text-2xl font-semibold text-center mb-4">
          {t("title")}
        </h2>

        {/* Anrede */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("salutation")} *
          </label>
          <select
            name="salutation"
            value={formData.salutation}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">{t("choose")}</option>
            <option value="Frau">{t("mrs")}</option>
            <option value="Herr">{t("mr")}</option>
            <option value="Divers">{t("diverse")}</option>
          </select>
        </div>

        {/* Vorname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("firstName")} *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Nachname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("lastName")} *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Institution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("institution")}
          </label>
          <input
            type="text"
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Straße / Nr */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("street")} *
          </label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Adresszusatz */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("addressExtra")}
          </label>
          <input
            type="text"
            name="addressExtra"
            value={formData.addressExtra}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* PLZ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("zip")} *
          </label>
          <input
            type="text"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Ort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("city")} *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Land */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("country")} *
          </label>
          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">{t("choose")}</option>
            {Object.entries(
              countries.getNames(locale === "de" ? "de" : "es", {
                select: "official",
              })
            ).map(([code, name]) => (
              <option key={code} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Telefonnummer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("phone")}
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("email")} *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Mitteilung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("message")}
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Datenschutz */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="privacy"
            checked={formData.privacy}
            onChange={handleChange}
            required
            className="mr-2"
          />
          <label className="text-sm">
            {t("privacyText")}{" "}
            <Link href="/datenschutz" className="text-red-600 underline">
              {t("privacyLink")}
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-red-700 text-white rounded hover:bg-red-800 transition"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}

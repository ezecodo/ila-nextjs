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
}) {
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

    // 👉 Combinar items seleccionados
    // 👉 Combinar items seleccionados
    const items = [
      ...selectedNormal.map((item) => ({
        editionId: Number(item.id), // 👈 asegurar que es Int
        qty: item.qty,
      })),
      ...selectedOffers.map((item) => ({
        editionId: Number(item.id),
        qty: item.qty,
      })),
    ];

    console.log("📦 Items enviados al backend:", items);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, items }),
      });

      if (!res.ok) throw new Error("❌ Error al crear el pedido");

      const data = await res.json();
      console.log("✅ Pedido creado:", data);
      alert(t("successMessage"));
    } catch (error) {
      console.error(error);
      alert("❌ Hubo un problema con tu pedido");
    }
  };

  return (
    <form
      id="orderForm"
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4"
    >
      <h2 className="text-2xl font-semibold text-center mb-4">{t("title")}</h2>

      {/* Anrede */}
      <div>
        <label className="block text-sm font-medium">{t("salutation")} *</label>
        <select
          name="salutation"
          value={formData.salutation}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">{t("choose")}</option>
          <option value="Frau">{t("mrs")}</option>
          <option value="Herr">{t("mr")}</option>
          <option value="Divers">{t("diverse")}</option>
        </select>
      </div>

      {/* Vorname */}
      <div>
        <label className="block text-sm font-medium">{t("firstName")} *</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Nachname */}
      <div>
        <label className="block text-sm font-medium">{t("lastName")} *</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Institution */}
      <div>
        <label className="block text-sm font-medium">{t("institution")}</label>
        <input
          type="text"
          name="institution"
          value={formData.institution}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Straße / Nr */}
      <div>
        <label className="block text-sm font-medium">{t("street")} *</label>
        <input
          type="text"
          name="street"
          value={formData.street}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Adresszusatz */}
      <div>
        <label className="block text-sm font-medium">{t("addressExtra")}</label>
        <input
          type="text"
          name="addressExtra"
          value={formData.addressExtra}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* PLZ */}
      <div>
        <label className="block text-sm font-medium">{t("zip")} *</label>
        <input
          type="text"
          name="zip"
          value={formData.zip}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Ort */}
      <div>
        <label className="block text-sm font-medium">{t("city")} *</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Land */}
      <div>
        <label className="block text-sm font-medium">{t("country")} *</label>
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
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
        <label className="block text-sm font-medium">{t("phone")}</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium">{t("email")} *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Mitteilung */}
      <div>
        <label className="block text-sm font-medium">{t("message")}</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
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
  );
}

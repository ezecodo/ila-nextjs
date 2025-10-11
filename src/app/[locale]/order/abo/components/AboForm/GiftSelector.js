"use client";

import { useTranslations } from "next-intl";

export default function GiftSelector({ gifts, form, handleChange, onSelect }) {
  const t = useTranslations("abo");

  if (!gifts || gifts.length === 0)
    return (
      <p className="text-gray-500 text-sm mt-2">{t("noGiftsAvailable")}</p>
    );

  return (
    <div className="mt-6 border-l-4 border-green-500 rounded-xl p-5 bg-green-50 dark:bg-green-900/10">
      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {t("giftSectionTitle")}
      </h3>

      {/* Texto introductorio */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        {t("giftIntroText")}
      </p>

      {/* Selector de regalo */}
      <div className="mb-4">
        <label className="block font-medium mb-2">{t("selectGiftLabel")}</label>
        <select
          className="border border-gray-300 dark:border-gray-600 p-2.5 rounded-lg w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          value={form.giftId || ""}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">{t("noGiftOption")}</option>
          {gifts.map((gift) => (
            <option key={gift.id} value={gift.id}>
              {gift.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de envío */}
      <div>
        <label className="block font-medium mb-2">
          {t("giftDeliveryLabel")}
        </label>
        <select
          className="border border-gray-300 dark:border-gray-600 p-2.5 rounded-lg w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          value={form.giftDelivery || "to_payer"}
          onChange={(e) => handleChange("giftDelivery", e.target.value)}
        >
          <option value="to_payer">{t("giftDeliverySelf")}</option>
          <option value="to_recipient">{t("giftDeliveryGiftAddress")}</option>
        </select>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function CookieConsent() {
  const t = useTranslations("cookie");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const hasAcceptedCookies = localStorage.getItem("cookiesAccepted");
    if (!hasAcceptedCookies) {
      setShowPopup(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setShowPopup(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookiesAccepted", "false");
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
        <h2 className="text-lg font-bold">{t("title")}</h2>
        <p className="text-sm text-gray-700 mt-2">{t("message")}</p>
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={acceptCookies}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            {t("accept")}
          </button>
          <button
            onClick={rejectCookies}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            {t("reject")}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          <Link href="/privacy" className="underline text-blue-600">
            {t("moreInfo")}
          </Link>
        </p>
      </div>
    </div>
  );
}

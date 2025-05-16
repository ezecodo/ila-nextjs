"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DonationPopup({ articleId }) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("donationPopup"); // 🔥 Importar traducciones

  useEffect(() => {
    if (!articleId) return;

    const seenArticles =
      JSON.parse(sessionStorage.getItem("seenArticles")) || [];

    if (!seenArticles.includes(articleId)) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        seenArticles.push(articleId);
        sessionStorage.setItem("seenArticles", JSON.stringify(seenArticles));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [articleId]);

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
    >
      <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          onClick={() => setIsOpen(false)}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t("title")}</h2>
        <p className="text-gray-600 mb-4">{t("description")}</p>
        <div className="flex justify-center gap-4">
          <Link
            href="/donar"
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800 transition"
          >
            {t("donateButton")}
          </Link>
          <Link
            href="/suscribirse"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-800 transition"
          >
            {t("subscribeButton")}
          </Link>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
import { useState } from "react";
import LatestDossier from "../../../dashboard-users/LatestDossier/LatestDossier";
import PdfDossiers from "../../../dashboard-users/PdfDossiers/PdfDossiers";
import FavoriteArticlesList from "../../../dashboard-users/FavoriteArticleList/FavoriteArticleList";

export default function TranslatorDigitalAbo() {
  const { data: session } = useSession();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState("latest-dossier");

  const userId = session?.user?.id;

  if (!userId) {
    return (
      <p className="text-center text-gray-500 p-6">
        Debes iniciar sesión para ver tu Digital ABO.
      </p>
    );
  }

  const tabs = [
    { key: "latest-dossier", label: "📖 Dossier actual" },
    { key: "pdf-dossiers", label: "📰 Leer dossiers (PDF)" },
    { key: "favorites", label: "⭐ Favoritos" },
  ];

  return (
    <div className="p-6">
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight">
        <span style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}>
          <span className="text-gray-900 dark:text-gray-100">DIGI</span>
          <span className="text-[#BD0E0D]">abo</span>
        </span>
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Tus beneficios de suscriptor Digital ABO.
      </p>

      <nav className="mb-6 flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-[#BD0E0D] text-[#BD0E0D]"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        {activeTab === "latest-dossier" && <LatestDossier locale={locale} />}
        {activeTab === "pdf-dossiers" && <PdfDossiers locale={locale} />}
        {activeTab === "favorites" && <FavoriteArticlesList />}
      </div>
    </div>
  );
}

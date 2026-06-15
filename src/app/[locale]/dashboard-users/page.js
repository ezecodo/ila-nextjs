"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { FaArrowLeft } from "react-icons/fa";
import AccountSettings from "../components/AccountSettings/AccountSettings";
import FavoriteArticlesList from "./FavoriteArticleList/FavoriteArticleList";
import PdfDossiers from "./PdfDossiers/PdfDossiers";
import LatestDossier from "./LatestDossier/LatestDossier";

export default function UserDashboard() {
  const [selectedTab, setSelectedTab] = useState("favorites");
  const [hasPdfAbo, setHasPdfAbo] = useState(false);
  const locale = useLocale();
  const t = useTranslations("user_dashboard");
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    fetch("/api/user/pdf-abo")
      .then((r) => r.json())
      .then((data) => {
        if (data.hasPdfAbo) {
          setHasPdfAbo(true);
          // El ABO aterriza directo en el dossier actual
          setSelectedTab("latest-dossier");
        }
      })
      .catch(() => {});
  }, []);

  const menuItems = [
    ...(hasPdfAbo
      ? [{ key: "latest-dossier", label: t("tabs.latest_dossier") }]
      : []),
    { key: "favorites", label: t("tabs.favorites") },
    ...(hasPdfAbo ? [{ key: "pdf-dossiers", label: t("tabs.pdf_dossiers") }] : []),
    { key: "account", label: t("tabs.account") },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Barra de regreso al panel admin (solo en modo vista previa) */}
      {isAdmin && (
        <div className="bg-[#BD0E0D] text-white text-sm">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center justify-between gap-3">
            <span className="opacity-90">{t("adminPreviewNote")}</span>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap hover:underline"
            >
              <FaArrowLeft size={11} /> {t("backToAdmin")}
            </Link>
          </div>
        </div>
      )}

      {/* Encabezado + tabs horizontales */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <h1 className="text-2xl font-bold pt-6 pb-4 text-gray-900 dark:text-gray-100">
            {t("title")}
          </h1>
          <nav className="flex gap-6 overflow-x-auto -mb-px">
            {menuItems.map((item) => {
              const active = selectedTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setSelectedTab(item.key)}
                  aria-current={active ? "page" : undefined}
                  className={`relative whitespace-nowrap pb-3 pt-1 text-sm font-semibold border-b-2 transition-colors ${
                    active
                      ? "border-[#BD0E0D] text-[#BD0E0D]"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {selectedTab === "account" && <AccountSettings />}
        {selectedTab === "latest-dossier" && hasPdfAbo && (
          <LatestDossier locale={locale} />
        )}
        {selectedTab === "favorites" && <FavoriteArticlesList />}
        {selectedTab === "pdf-dossiers" && hasPdfAbo && (
          <PdfDossiers locale={locale} />
        )}
      </div>
    </div>
  );
}


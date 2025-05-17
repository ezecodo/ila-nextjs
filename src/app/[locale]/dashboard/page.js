"use client";

import { useTranslations } from "next-intl";

export default function AdminDashboard() {
  const t = useTranslations("dashboard");

  return (
    <div className="text-center mt-10">
      <h1 className="text-2xl font-bold text-gray-800">
        {t("welcome") || "Bienvenido al panel de administración"}
      </h1>
    </div>
  );
}

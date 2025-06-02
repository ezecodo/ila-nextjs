"use client";

import { useTranslations } from "next-intl";
import ActivityFeed from "../dashboard/components/ActivityFeed/ActivityFeed";

export default function AdminDashboard() {
  const t = useTranslations();

  return (
    <div className="text-center mt-10">
      <h1 className="text-2xl font-bold text-gray-800">
        {t("dashboard.welcome", {
          default: "Bienvenido al panel de administración",
        })}
      </h1>
      <ActivityFeed />
    </div>
  );
}

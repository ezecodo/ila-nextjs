"use client";

import { useTranslations } from "next-intl";
import ActivityFeed from "../components/ActivityFeed/ActivityFeed";
import { useSession } from "next-auth/react";

export default function K2Dashboard() {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const role = session?.user?.role || "user";

  if (!session?.user || !["admin", "k2"].includes(role)) {
    return <p className="text-red-600">Acceso denegado</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t("k2.title")}</h1>
      <p className="mt-4 text-gray-700">{t("k2.description")}</p>

      {/* 👇 Ahora K2 también ve el feed */}
      {(role === "admin" || role === "k2") && (
        <div className="mt-8">
          <ActivityFeed />
        </div>
      )}
    </div>
  );
}

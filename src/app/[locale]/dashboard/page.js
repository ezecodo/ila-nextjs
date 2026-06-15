"use client";

import { useTranslations } from "next-intl";
import ActivityFeed from "../dashboard/components/ActivityFeed/ActivityFeed";
import PrognoseSummary from "../dashboard/components/PrognoseSummary/PrognoseSummary";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const t = useTranslations();
  const { data: session } = useSession();
  const role = session?.user?.role || "user"; // ✅ sin TypeScript

  return (
    <div className="text-center mt-10">
      <h1 className="text-2xl font-bold text-gray-800">
        {t("dashboard.welcome", {
          default:
            role === "admin"
              ? "Bienvenido al panel de administración"
              : "Bienvenido al panel de traducciones",
        })}
      </h1>

      {/* 👇 Solo admin ve la prognose + el feed */}
      {(role === "admin" || role === "k2") && (
        <>
          <div className="max-w-4xl mx-auto mt-8 text-left">
            <PrognoseSummary />
          </div>
          <ActivityFeed />
        </>
      )}
    </div>
  );
}

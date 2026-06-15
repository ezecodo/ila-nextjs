"use client";

import ActivityFeed from "../components/ActivityFeed/ActivityFeed";
import PrognoseSummary from "../components/PrognoseSummary/PrognoseSummary";
import { useTranslations } from "next-intl";

export default function ActivityPage() {
  const t = useTranslations("activity");
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-red-600">{t("title")}</h1>
      <PrognoseSummary />
      <ActivityFeed />
    </div>
  );
}

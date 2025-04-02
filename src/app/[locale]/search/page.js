"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

const SearchResults = dynamic(
  () => import("../components/Articles/SearchResults"),
  {
    ssr: false, // 🔥 Evita prerenderización en el servidor
  }
);

export default function SearchPage() {
  const t = useTranslations("search");
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4">{t("resultstitle")}</h2>
      <Suspense fallback={<p>{t("loading")}</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

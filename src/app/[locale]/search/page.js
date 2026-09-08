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
      {/* El título (resultstitle / allArticlesTitle) vive dentro de SearchResults, que es
          quien sabe si hay query o no — así no se duplica la lógica acá. */}
      <Suspense fallback={<p>{t("loading")}</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

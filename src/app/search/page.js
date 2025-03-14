"use client"; // ✅ Forzar renderizado en el cliente

import dynamic from "next/dynamic";
import { Suspense } from "react";

const SearchResults = dynamic(
  () => import("@/components/Articles/SearchResults"),
  {
    ssr: false, // 🔥 Evita prerenderización en el servidor
  }
);

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4">Resultados de búsqueda:</h2>
      <Suspense fallback={<p>Cargando resultados...</p>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}

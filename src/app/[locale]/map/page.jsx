"use client";

import dynamic from "next/dynamic";
import { useLocale } from "next-intl";

// Importar el NUEVO GlobeMap (con Three.js aislado)
const GlobeMap = dynamic(() => import("../components/GlobeMap/GlobeMap"), {
  ssr: false,
});

export default function MapaPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            {locale === "de"
              ? "🌎 Lateinamerika erkunden"
              : "🌎 Explorar Latinoamérica"}
          </h1>
          <p className="text-gray-400 text-lg">
            {locale === "de"
              ? "Klicke auf ein Land, um alle Artikel zu sehen"
              : "Haz click en un país para ver todos los artículos"}
          </p>
        </div>

        {/* Usar el NUEVO GlobeMap con Three.js aislado */}
        <GlobeMap />

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-white/80">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🌎</div>
            <p className="text-sm">
              {locale === "de" ? "Südamerika" : "Sudamérica"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🌴</div>
            <p className="text-sm">
              {locale === "de" ? "Mittelamerika" : "Centroamérica"}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">🏝️</div>
            <p className="text-sm">{locale === "de" ? "Karibik" : "Caribe"}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📰</div>
            <p className="text-sm">
              {locale === "de" ? "Artikel entdecken" : "Descubrir artículos"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import dynamic from "next/dynamic";
import { countryToRegionId, countryColors, countryNames } from "./countryData";

// Tus coordenadas exactas (las mismas que ya tienes)
const countryCoordinates = {
  MEX: { lat: 23.6345, lon: -102.5528 },
  GTM: { lat: 15.7835, lon: -90.2308 },
  BLZ: { lat: 17.1899, lon: -88.4976 },
  HND: { lat: 15.2, lon: -86.2419 },
  SLV: { lat: 13.7942, lon: -88.8965 },
  NIC: { lat: 12.8654, lon: -85.2072 },
  CRI: { lat: 9.7489, lon: -83.7534 },
  PAN: { lat: 8.538, lon: -80.7821 },
  COL: { lat: 4.5709, lon: -74.2973 },
  VEN: { lat: 6.4238, lon: -66.5897 },
  ECU: { lat: -1.8312, lon: -78.1834 },
  PER: { lat: -9.19, lon: -75.0152 },
  BOL: { lat: -16.2902, lon: -63.5887 },
  BRA: { lat: -14.235, lon: -51.9253 },
  PRY: { lat: -23.4425, lon: -58.4438 },
  URY: { lat: -32.5228, lon: -55.7658 },
  ARG: { lat: -38.4161, lon: -63.6167 },
  CHL: { lat: -35.6751, lon: -71.543 },
  GUY: { lat: 4.8604, lon: -58.9302 },
  SUR: { lat: 3.9193, lon: -56.0278 },
  GUF: { lat: 3.9339, lon: -53.1258 },
  CUB: { lat: 21.5218, lon: -77.7812 },
  JAM: { lat: 18.1096, lon: -77.2975 },
  HTI: { lat: 18.9712, lon: -72.2852 },
  DOM: { lat: 18.7357, lon: -70.1627 },
  PRI: { lat: 18.2208, lon: -66.5901 },
  TTO: { lat: 10.6918, lon: -61.2225 },
  USA: { lat: 37.0902, lon: -95.7129 },
  CAN: { lat: 56.1304, lon: -106.3468 },
};

// Importar dinámicamente el componente Three.js aislado
const IsolatedThreeScene = dynamic(() => import("./IsolatedThreeScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-white">Cargando globo 3D...</div>
    </div>
  ),
});

export default function GlobeMap() {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const router = useRouter();
  const locale = useLocale();

  const handleCountryClick = (countryCode) => {
    const regionId = countryToRegionId[countryCode];
    if (regionId) {
      router.push(`/${locale}/regions/${regionId}`);
    }
  };

  const tooltipName = hoveredCountry
    ? countryNames[hoveredCountry]?.[locale] || countryNames[hoveredCountry]?.de
    : null;

  return (
    <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden">
      {hoveredCountry && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {tooltipName}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {locale === "de" ? "Klicken zum Erkunden" : "Click para explorar"}
          </p>
        </div>
      )}

      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white">Inicializando visualización 3D...</div>
          </div>
        }
      >
        <IsolatedThreeScene
          countryCoordinates={countryCoordinates}
          countryColors={countryColors}
          onCountryHover={setHoveredCountry}
          onCountryClick={handleCountryClick}
          hoveredCountry={hoveredCountry}
        />
      </Suspense>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {locale === "de"
          ? "🖱️ Ziehen zum Drehen • Scrollen zum Zoomen"
          : "🖱️ Arrastra para rotar • Scroll para zoom"}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { countryToRegionId, countryNames } from "./countryData";

// Esto es SOLO para probar - sin Three.js por ahora
export default function SimpleGlobe() {
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
    <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
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

      {/* Globo simple de prueba */}
      <div className="w-64 h-64 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700 shadow-2xl relative">
        {/* Simulación de puntos de países */}
        <div
          className="absolute top-1/4 left-1/2 w-4 h-4 bg-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform"
          onMouseEnter={() => setHoveredCountry("MEX")}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => handleCountryClick("MEX")}
        ></div>

        <div
          className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-125 transition-transform"
          onMouseEnter={() => setHoveredCountry("ARG")}
          onMouseLeave={() => setHoveredCountry(null)}
          onClick={() => handleCountryClick("ARG")}
        ></div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {locale === "de"
          ? "🖱️ Demo simple - Prueba los puntos amarillo y verde"
          : "🖱️ Demo simple - Prueba los puntos amarillo y verde"}
      </div>
    </div>
  );
}

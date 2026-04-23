"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

// Importar el NUEVO GlobeMap (con Three.js aislado)
const GlobeMap = dynamic(() => import("../components/GlobeMap/GlobeMap"), {
  ssr: false,
});

export default function MapaPage() {
  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "#050505" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo/50_Schriftzug_weiss.png"
            alt="ila 50"
            width={199}
            height={141}
            priority
          />
        </div>

        {/* Usar el NUEVO GlobeMap con Three.js aislado */}
        <GlobeMap />
      </div>
    </div>
  );
}

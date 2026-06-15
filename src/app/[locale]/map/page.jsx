"use client";

import dynamic from "next/dynamic";

// Importar el NUEVO GlobeMap (con Three.js aislado)
const GlobeMap = dynamic(() => import("../components/GlobeMap/GlobeMap"), {
  ssr: false,
});

export default function MapaPage() {
  return (
    // Márgenes negativos para romper el padding horizontal del <main> del layout
    // y que el globo ocupe todo el ancho (sin barras claras a los lados).
    <div
      className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 -mt-[80px] md:mt-0"
      style={{ backgroundColor: "#050505" }}
    >
      <GlobeMap />
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LatestEdition1 from "./components/Editions/LatestEdition1";
import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";
import DynamicBanner from "./components/DynamicBanner/DynamicBanner";
import NetworkCarousel from "./components/NetworkCarousel/NetworkCarousel";

export default function Home() {
  const pathname = usePathname();
  const [showNetwork, setShowNetwork] = useState(false);

  useEffect(() => {
    if (pathname === "/" && window.location.hash === "#dossiers") {
      const el = document.getElementById("dossiers");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname]);

  useEffect(() => {
    // Estrategia en 3 pasos:

    // 1. Bloqueamos NetworkCarousel completamente al inicio
    setShowNetwork(false);

    // 2. Esperamos a que el contenido principal tenga tiempo de renderizarse
    const timer1 = setTimeout(() => {
      // 3. Forzamos un reflow y luego mostramos
      requestAnimationFrame(() => {
        setShowNetwork(true);
      });
    }, 1500); // 1.5 segundos - ajusta según tu contenido

    return () => clearTimeout(timer1);
  }, []);

  return (
    <div className="w-full px-0">
      <main className="w-full">
        <div className="w-full">
          <DynamicBanner position="top" />
          <CarouselFromDb placement="top" />

          <div id="dossiers" className="scroll-mt-[120px] mt-6">
            <LatestEdition1 />
          </div>

          <CarouselFromDb placement="after" />

          {/* Contenedor con display: none inicial */}
          <div
            style={{
              display: showNetwork ? "block" : "none",
              willChange: "display",
            }}
          >
            <NetworkCarousel />
          </div>
        </div>
      </main>
    </div>
  );
}

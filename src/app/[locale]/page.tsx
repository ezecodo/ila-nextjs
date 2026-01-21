"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import LatestEdition1 from "./components/Editions/LatestEdition1";
import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";
import DynamicBanner from "./components/DynamicBanner/DynamicBanner";
import NetworkCarousel from "./components/NetworkCarousel/NetworkCarousel"; // 👈 AÑADIR

export default function Home() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/" && window.location.hash === "#dossiers") {
      const el = document.getElementById("dossiers");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname]);

  return (
    <div className="w-full px-0">
      <main className="w-full">
        <div className="w-full">
          {/* 🎁 Banner Promocional - Diciembre 2025 */}
          <DynamicBanner position="top" />

          {/* 🆕 Carruseles TOP (antes de ediciones) */}
          <CarouselFromDb placement="top" />

          <div id="dossiers" className="scroll-mt-[120px] mt-6">
            <LatestEdition1 />
          </div>

          {/* Carruseles normales (después de ediciones) */}
          <CarouselFromDb placement="after" />
          {/* 🌐 Carousel de Partners - AL FINAL */}
          <NetworkCarousel />
        </div>
      </main>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LatestEdition1 from "./components/Editions/LatestEdition1";
import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";
import DynamicBanner from "./components/DynamicBanner/DynamicBanner";
import NetworkCarousel from "./components/NetworkCarousel/NetworkCarousel";

export default function Home() {
  const pathname = usePathname();
  const [isNetworkVisible, setIsNetworkVisible] = useState(false);

  useEffect(() => {
    if (pathname === "/" && window.location.hash === "#dossiers") {
      const el = document.getElementById("dossiers");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname]);

  useEffect(() => {
    // Forzamos un delay más largo para asegurar que TODO lo demás se renderice primero
    const timer = setTimeout(() => {
      setIsNetworkVisible(true);
    }, 2000); // 2 segundos - ajusta según necesidad

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full px-0">
      <main className="w-full">
        <div className="w-full">
          {/* 🎁 Banner Promocional */}
          <DynamicBanner position="top" />

          {/* 🆕 Carruseles TOP */}
          <CarouselFromDb placement="top" />

          <div id="dossiers" className="scroll-mt-[120px] mt-6">
            <LatestEdition1 />
          </div>

          {/* Carruseles normales */}
          <CarouselFromDb placement="after" />

          {/* 🌐 Carousel de Partners - SOLO aparece después de 2 segundos */}
          {isNetworkVisible && <NetworkCarousel />}
        </div>
      </main>
    </div>
  );
}

"use client";
import { useEffect, useState, Suspense, lazy } from "react";
import { usePathname } from "next/navigation";
import LatestEdition1 from "./components/Editions/LatestEdition1";
import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";
import DynamicBanner from "./components/DynamicBanner/DynamicBanner";
import IlaLoader from "./components/IlaLoader/IlaLoader";

// Carga diferida de NetworkCarousel
const NetworkCarousel = lazy(
  () => import("./components/NetworkCarousel/NetworkCarousel"),
);

export default function Home() {
  const pathname = usePathname();
  const [showNetworkCarousel, setShowNetworkCarousel] = useState(false);

  useEffect(() => {
    if (pathname === "/" && window.location.hash === "#dossiers") {
      const el = document.getElementById("dossiers");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname]);

  // Esperar a que el contenido principal se renderice primero
  useEffect(() => {
    // Pequeño delay para asegurar que el contenido principal está en pantalla
    const timer = setTimeout(() => {
      setShowNetworkCarousel(true);
    }, 800); // 800ms debería ser suficiente para que el contenido principal se vea

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

          {/* 🌐 Carousel de Partners - SOLO se muestra después */}
          {showNetworkCarousel && (
            <Suspense
              fallback={
                <div className="h-32 w-full bg-gray-50 animate-pulse rounded-lg"></div>
              }
            >
              <NetworkCarousel />
            </Suspense>
          )}
        </div>
      </main>
    </div>
  );
}

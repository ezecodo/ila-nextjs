"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import LatestEdition1 from "./components/Editions/LatestEdition1";
import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";
import DynamicBanner from "./components/DynamicBanner/DynamicBanner";
import NetworkCarousel from "./components/NetworkCarousel/NetworkCarousel";

export default function Home() {
  const pathname = usePathname();

  const [showNetworkCarousel, setShowNetworkCarousel] = useState(false);
  // Nuevo estado para controlar el "Tiempo de Gracia"
  const [isPageStable, setIsPageStable] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lógica del scroll hash
    if (pathname === "/" && window.location.hash === "#dossiers") {
      const el = document.getElementById("dossiers");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname]);

  useEffect(() => {
    // 1. ESTA ES LA CLAVE: Esperamos 3 segundos (3000ms)
    // Esto le da tiempo a las imágenes de arriba para cargar y estirar la página
    const stabilityTimer = setTimeout(() => {
      setIsPageStable(true);
    }, 3000); // 👈 Puedes subir a 4000 si tu internet es lento o bajar a 2000 si es muy rápido

    return () => clearTimeout(stabilityTimer);
  }, []);

  useEffect(() => {
    // 2. Solo empezamos a observar si la página ya está "estable" (pasaron los 3 seg)
    if (!isPageStable) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowNetworkCarousel(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px",
      },
    );

    if (carouselRef.current) {
      observer.observe(carouselRef.current);
    }

    return () => {
      if (carouselRef.current) observer.unobserve(carouselRef.current);
    };
  }, [isPageStable]);

  return (
    <div className="w-full px-0">
      <main className="w-full">
        <div className="w-full">
          <DynamicBanner position="top" />
          <CarouselFromDb placement="top" />

          <div id="dossiers" className="scroll-mt-[120px] mt-1 lg:mt-6">
            <LatestEdition1 />
          </div>

          <CarouselFromDb placement="after" />

          {/* 🌐 Carousel de Partners - CARGA DIFERIDA + ESPERA ESTABILIDAD */}
          <div
            ref={carouselRef}
            className="w-full min-h-[50px]"
            aria-hidden="true"
          >
            {showNetworkCarousel && <NetworkCarousel />}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import LatestEdition1 from "./components/Editions/LatestEdition1";
import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";
import { PromoHeroBanner } from "./order/abo/components/PromoForm/PromoGiftSection";

export default function Home() {
  const pathname = usePathname();
  const [editions, setEditions] = useState([]);

  useEffect(() => {
    async function fetchEditions() {
      try {
        const res = await fetch("/api/editions?sort=desc&limit=3");
        if (!res.ok) return;
        const data = await res.json();
        const editions = Array.isArray(data)
          ? data
          : Array.isArray(data?.editions)
            ? data.editions
            : [];
        setEditions(editions);
      } catch (e) {
        console.error("Error cargando ediciones:", e);
      }
    }
    fetchEditions();
  }, []);

  useEffect(() => {
    if (pathname === "/" && window.location.hash === "#dossiers") {
      const el = document.getElementById("dossiers");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname]);

  return (
    <div className="w-full px-0 py-4">
      <main className="w-full">
        <div className="w-full">
          {/* 🎁 Banner Promocional - Diciembre 2025 */}
          <div className="w-full mb-10">
            <PromoHeroBanner editions={editions} />
          </div>

          {/* 🆕 Carruseles TOP (antes de ediciones) */}
          <CarouselFromDb placement="top" />

          <div id="dossiers" className="scroll-mt-[120px]">
            <LatestEdition1 />
          </div>

          {/* Carruseles normales (después de ediciones) */}
          <CarouselFromDb placement="after" />
        </div>
      </main>
    </div>
  );
}

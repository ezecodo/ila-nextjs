"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import LatestEdition from "./components/Editions/LatestEdition";
import CarouselFromDb from "./components/Articles/CarouselFromDb/CarouselFromDb";

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
    <div className="w-full px-1 sm:px-4 py-4">
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-1 md:col-span-12 p-0">
          <CarouselFromDb />
          <div id="dossiers" className="scroll-mt-[120px]">
            <LatestEdition />
          </div>
        </div>
      </main>
    </div>
  );
}

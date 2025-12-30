// components/NetworkCarousel/NetworkCarousel.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function NetworkCarousel() {
  const [partners, setPartners] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    async function fetchPartners() {
      try {
        const res = await fetch("/api/network");
        const data = await res.json();
        setPartners(data.filter((p) => p.logoUrl));
      } catch (error) {
        console.error("Error fetching partners:", error);
      }
    }

    fetchPartners();
  }, []);

  // Scroll con rueda del mouse (horizontal) - solo desktop
  useEffect(() => {
    if (isMobile) return;

    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [isMobile]);

  const duplicatedPartners = [...partners, ...partners];

  // VERSIÓN MOBILE
  if (isMobile) {
    return (
      <div className="w-full bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-6 text-center">
          {locale === "es" ? "Red de Colaboración" : "Netzwerk"}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {partners.map((partner) => {
            const description =
              locale === "es" ? partner.descriptionEs : partner.description;
            const name =
              locale === "es" && partner.nameEs ? partner.nameEs : partner.name;

            return (
              <Link
                key={partner.id}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
              >
                {/* Logo */}
                <div className="relative w-full h-24 mb-3">
                  <Image
                    src={partner.logoUrl}
                    alt={name}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Nombre */}
                <h3 className="font-bold text-red-600 dark:text-red-400 text-center mb-2">
                  {name}
                </h3>

                {/* Descripción */}
                {description && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm text-center">
                    {description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // VERSIÓN DESKTOP (carousel)
  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 py-8 relative">
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="flex gap-6 px-6"
          style={{
            animation: isPaused ? "none" : "scroll 80s linear infinite",
            width: "max-content",
          }}
        >
          {duplicatedPartners.map((partner, index) => {
            const description =
              locale === "es" ? partner.descriptionEs : partner.description;
            const name =
              locale === "es" && partner.nameEs ? partner.nameEs : partner.name;

            return (
              <Link
                key={`${partner.id}-${index}`}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group flex-shrink-0 w-48 h-32 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-xl transition-all overflow-hidden"
              >
                {/* Logo */}
                <div className="absolute inset-0 p-4 transition-all group-hover:blur-sm group-hover:opacity-30">
                  <div className="relative w-full h-full">
                    <Image
                      src={partner.logoUrl}
                      alt={name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Info overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="font-bold text-red-600 dark:text-red-400 text-center mb-2 text-sm">
                    {name}
                  </div>
                  {description && (
                    <div className="text-gray-900 dark:text-gray-100 text-center text-xs leading-tight line-clamp-4">
                      {description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

"use client";

// Reemplaza a los antiguos SideBanner50 + PartyBanner (hardcodeados) en el sidebar de la
// edición actual. Trae los banners activos del sidebar desde /api/banners (gestionables en
// /dashboard/banners) — el equipo de ila decide qué se muestra sin tocar código.
//
// Dos formas de mostrarlos, elegidas por banner en el dashboard (campo `position`):
// - "edition-sidebar-stacked": apilados, todos siempre visibles (uno debajo del otro).
// - "edition-sidebar": carrusel — si hay 2+ banners ahí, rotan uno a la vez.
// Los apilados van primero, seguidos del carrusel (si hay banners ahí) — se pueden combinar.
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Slider from "../../SafeSlick/SafeSlick";
import BannerSlide, { BANNER_HEIGHT } from "./BannerSlide";
import { normalizeBlocks } from "./blocks";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const CAROUSEL_SETTINGS = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 6000,
  pauseOnHover: true,
  arrows: false,
  dotsClass: "slick-dots !bottom-2",
};

export default function SlideBanner() {
  const locale = useLocale();
  const [stacked, setStacked] = useState(null); // null = cargando
  const [carousel, setCarousel] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [stackedRes, carouselRes] = await Promise.all([
          fetch("/api/banners?position=edition-sidebar-stacked"),
          fetch("/api/banners?position=edition-sidebar"),
        ]);
        const [stackedData, carouselData] = await Promise.all([
          stackedRes.json(),
          carouselRes.json(),
        ]);
        const stackedList = Array.isArray(stackedData) ? stackedData : [];
        const carouselList = Array.isArray(carouselData) ? carouselData : [];
        if (cancelled) return;
        setStacked(stackedList);
        setCarousel(carouselList);

        // Solo pedimos las stats del sitio si algún banner tiene un bloque "stats"
        const needsStats = [...stackedList, ...carouselList].some((b) =>
          normalizeBlocks(b.blocks).items.some((block) => block.type === "stats"),
        );
        if (needsStats) {
          const statsRes = await fetch("/api/stats/site");
          const statsData = await statsRes.json();
          if (!cancelled) setStats(statsData);
        }
      } catch (error) {
        console.error("Error fetching sidebar banners:", error);
        if (!cancelled) {
          setStacked([]);
          setCarousel([]);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (stacked === null || carousel === null) return null; // cargando
  if (stacked.length === 0 && carousel.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {stacked.map((banner) => (
        <BannerSlide key={banner.id} banner={banner} stats={stats} locale={locale} />
      ))}

      {carousel.length === 1 && (
        <BannerSlide banner={carousel[0]} stats={stats} locale={locale} />
      )}

      {carousel.length > 1 && (
        <div
          className="[&_.slick-list]:h-full [&_.slick-track]:h-full [&_.slick-slide>div]:h-full [&_.slick-slide]:h-full"
          style={{ height: BANNER_HEIGHT, flexShrink: 0 }}
        >
          <Slider {...CAROUSEL_SETTINGS}>
            {carousel.map((banner) => (
              <div key={banner.id} className="h-full">
                <BannerSlide banner={banner} stats={stats} locale={locale} />
              </div>
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
}

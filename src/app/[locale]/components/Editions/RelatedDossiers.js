"use client";

import { useEffect, useState } from "react";
import Slider from "../SafeSlick/SafeSlick";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";
import SmartImage from "../SmartImage/SmartImage";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Carrusel de dossiers relacionados al actual (misma región / temas en común).
// Se monta en la página editorial/inhalt del dossier. `onSelect(id)` hace el
// swap suave in-page (sin recargar); si no se pasa, navega por href.
export default function RelatedDossiers({
  editionId,
  locale,
  title,
  onSelect,
  limit = 8,
}) {
  const [items, setItems] = useState([]);
  const isES = locale === "es";

  useEffect(() => {
    if (!editionId) return;
    let active = true;
    fetch(`/api/editions/related?editionId=${editionId}&limit=${limit}`)
      .then((r) => r.json())
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, [editionId, limit]);

  if (!items.length) return null;

  const slidesToShow = Math.min(4, items.length);
  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow,
    slidesToScroll: 1,
    arrows: items.length > slidesToShow,
    dots: false,
    swipe: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: Math.min(3, items.length), arrows: items.length > 3 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 2, arrows: false },
      },
    ],
  };

  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {title}
      </h2>

      <Slider {...settings}>
        {items.map((e) => {
          const dossierTitle =
            isES && e.isTranslatedES ? e.titleES || e.title : e.title;
          const year = e.datePublished
            ? new Date(e.datePublished).getFullYear()
            : null;
          const region = e.regions?.[0]?.name;
          const href = `/${locale}/editions/${e.id}`;

          const handleClick = (ev) => {
            if (onSelect) {
              ev.preventDefault();
              onSelect(e.id);
            }
          };

          return (
            <div key={e.id} className="px-2 focus:outline-none">
              <a
                href={href}
                onClick={handleClick}
                className="group block rounded-none"
              >
                <div className="relative w-full max-w-[240px] mx-auto aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-gray-300 dark:group-hover:border-gray-600 group-hover:shadow-md transition-all duration-300">
                  <SmartImage
                    src={e.coverImage}
                    alt={dossierTitle || `ila ${e.number}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="max-w-[240px] mx-auto mt-3">
                  <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 mb-1">
                    <span className="text-[#BD0E0D]">ila {e.number}</span>
                    {[region, year].filter(Boolean).length > 0 &&
                      ` · ${[region, year].filter(Boolean).join(" · ")}`}
                  </div>
                  <h3 className="text-[15px] font-bold leading-[1.25] text-gray-900 dark:text-gray-100 text-balance line-clamp-3">
                    <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
                      {dossierTitle}
                    </span>
                  </h3>
                </div>
              </a>
            </div>
          );
        })}
      </Slider>
    </section>
  );
}

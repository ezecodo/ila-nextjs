"use client";

import Slider from "../../SafeSlick/SafeSlick";
import { PrevArrow, NextArrow } from "../../Articles/CustomArrows/CustomArrows";
import MiniEditionCard from "../MiniEditionCard/MiniEditionCard";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function EditionsCarousel({
  editions,
  slidesToShow = 3,
  onAdd,
  type,
}) {
  if (!editions || editions.length === 0) return null;

  const settings = {
    infinite: editions.length > slidesToShow,
    speed: 500,
    slidesToShow,
    slidesToScroll: slidesToShow,
    arrows: editions.length > slidesToShow,
    swipe: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: editions.length > 1,
          dots: false,
        },
      },
    ],
  };

  return (
    <section className="relative w-full">
      <Slider {...settings}>
        {editions.map((edition) => (
          <div key={edition.id} className="px-3 focus:outline-none">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full mx-auto">
              <MiniEditionCard edition={edition} />
              {onAdd && (
                <div className="p-3 text-center">
                  <button
                    onClick={() => onAdd(edition, type)}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                  >
                    Zum Warenkorb hinzufügen
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}

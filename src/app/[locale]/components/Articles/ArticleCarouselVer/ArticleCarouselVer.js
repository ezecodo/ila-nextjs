"use client";

import Slider from "../../SafeSlick/SafeSlick";
import { PrevArrow, NextArrow } from "../CustomArrows/CustomArrows";
import MiniArticleCardGrid from "../MiniArticleCardGrid";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function ArticlesCarousel({ articles, slidesToShow = 3 }) {
  if (!articles || articles.length === 0) return null;

  const settings = {
    infinite: articles.length > slidesToShow,
    speed: 500,
    slidesToShow: slidesToShow,
    slidesToScroll: slidesToShow,
    arrows: articles.length > slidesToShow,
    dots: articles.length > slidesToShow,
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
          arrows: articles.length > 1,
          dots: false,
        },
      },
    ],
  };

  return (
    <section className="relative w-full">
      <Slider {...settings}>
        {articles.map((article) => (
          <div key={article.id} className="px-3 focus:outline-none">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full mx-auto">
              <MiniArticleCardGrid article={article} />
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}

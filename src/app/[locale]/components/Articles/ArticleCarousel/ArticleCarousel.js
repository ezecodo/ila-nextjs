"use client";

import { useEffect, useState } from "react";
import Slider from "../../SafeSlick/SafeSlick";
import { useLocale } from "next-intl";
import { PrevArrow, NextArrow } from "../CustomArrows/CustomArrows";
import QuietSectionHeader from "../../SectionsHeader/QuietSectionHeader";
import MiniArticleCardGrid from "../MiniArticleCardGrid";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function FilteredArticlesCarousel(props) {
  const {
    region,
    beitragstypId,
    title,
    limit,
    slidesToShow,
    isManual,
    manualArticles,
  } = props;

  const effectiveLimit = limit || 30;
  const effectiveSlidesToShow = slidesToShow || 3;

  const [articles, setArticles] = useState([]);
  const locale = useLocale();

  useEffect(() => {
    // 🆕 Si es manual, usar los artículos proporcionados
    if (isManual && manualArticles) {
      const articleIds = manualArticles.map((a) => a.id).join(",");

      fetch(`/api/articles/batch?ids=${articleIds}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("🔍 API devuelve:", data.length, "artículos");

          const orderedArticles = manualArticles
            .map((ma) => data.find((a) => a.id === ma.id))
            .filter(Boolean);

          console.log("📦 Ordenados:", orderedArticles.length);
          console.log(
            "🖼️ Con imágenes:",
            orderedArticles.filter(
              (a) => a.images?.length > 0 || a.articleImage,
            ).length,
          );
          console.log(
            "❌ Sin imágenes:",
            orderedArticles.filter(
              (a) => (!a.images || a.images.length === 0) && !a.articleImage,
            ).length,
          );

          setArticles(orderedArticles);
        })
        .catch(() => setArticles([]));

      return;
    }

    // ✅ Carrusel automático (lógica original)
    const params = new URLSearchParams();
    params.set("limit", effectiveLimit.toString());
    if (region) params.set("regionId", String(region));
    if (beitragstypId) params.set("beitragstypId", String(beitragstypId));
    params.set("locale", locale);

    fetch(`/api/articles/filtered?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = (data.articles || []).filter(
          (a) => a.images && a.images.length > 0,
        );
        setArticles(filtered);
      })
      .catch((err) => {
        console.error("Error cargando artículos:", err);
        setArticles([]);
      });
  }, [region, beitragstypId, effectiveLimit, locale, isManual, manualArticles]);

  if (!articles || articles.length === 0) return null;

  const singleSlide = articles.length === 1;

  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: singleSlide ? 1 : effectiveSlidesToShow,
    slidesToScroll: 1,
    arrows: articles.length > effectiveSlidesToShow,
    dots: articles.length > effectiveSlidesToShow,
    swipe: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    dotsClass: "slick-dots !bottom-[-2rem]",
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
    <section className="relative w-full md:px-8 pt-1 pb-10 md:pt-0 md:pb-12 [&_.slick-track]:!flex [&_.slick-slide]:!h-auto [&_.slick-slide>div]:h-full">
      {title && (
        <QuietSectionHeader title={title} variant="chip" className="mb-4" />
      )}
      <div className="pb-1 md:pb-2">
        <Slider {...settings}>
          {articles.map((article) => (
            <div
              key={article.id}
              className={`px-1 h-full ${
                articles.length === 1 ? "max-w-[400px] mx-auto" : ""
              }`}
            >
              <MiniArticleCardGrid article={article} />
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import ArticleCarousel from "../ArticleCarousel/ArticleCarousel";
import IlaLoader from "../../IlaLoader/IlaLoader";
import ArticleCarouselVer from "../ArticleCarouselVer/ArticleCarouselVer";

export default function CarouselFromDb({ placement = "after" }) {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/carousels")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((c) => c.placement === placement);
        setCarousels(filtered);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error cargando carruseles:", error);
        setLoading(false);
      });
  }, [placement]); // ← ✅ Agregar `placement` a las dependencias

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <IlaLoader />
      </div>
    );
  }

  console.log("🔍 Todos los carruseles:", carousels);
  carousels.forEach((c) => {
    console.log(`📦 Carrusel ID: ${c.id}`);
    console.log(`   Título: ${c.titleES}`);
    console.log(`   Tipo: ${c.carouselType}`);
    console.log(`   Es manual: ${c.isManual}`);
    console.log(`   Artículos:`, c.articles);
    console.log(`   Cantidad de artículos:`, c.articles?.length || 0);
  });

  return (
    <>
      {carousels.map((carousel) => {
        // Si es vertical, usar ArticleCarouselVer con props diferentes
        if (carousel.carouselType === "vertical") {
          return (
            <ArticleCarouselVer
              key={carousel.id}
              beitragstypId={carousel.beitragstypId}
              region={carousel.regionId || null}
              title={carousel.titleES}
              limit={carousel.limit}
              slidesToShow={4}
              isManual={carousel.isManual}
              manualArticles={
                carousel.isManual && carousel.articles
                  ? carousel.articles.map((ca) => ca.article)
                  : null
              }
            />
          );
        }

        // Si es horizontal, usar ArticleCarousel normal
        return (
          <ArticleCarousel
            key={carousel.id}
            beitragstypId={carousel.beitragstypId}
            region={carousel.regionId || null}
            title={carousel.titleES}
            limit={carousel.limit}
            isManual={carousel.isManual}
            manualArticles={
              carousel.isManual && carousel.articles
                ? carousel.articles.map((ca) => ca.article)
                : null
            }
          />
        );
      })}
    </>
  );
}

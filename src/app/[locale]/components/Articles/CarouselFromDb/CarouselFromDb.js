"use client";

import { useEffect, useState } from "react";
import ArticleCarousel from "../ArticleCarousel/ArticleCarousel";
import IlaLoader from "../../IlaLoader/IlaLoader";

export default function CarouselFromDb() {
  const [carousels, setCarousels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/carousels")
      .then((res) => res.json())
      .then((data) => {
        setCarousels(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error cargando carruseles:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <IlaLoader />
      </div>
    );
  }

  return (
    <>
      {carousels.map((carousel) => (
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
      ))}
    </>
  );
}

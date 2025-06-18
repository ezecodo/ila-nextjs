"use client";

import { useEffect, useState } from "react";
import ArticleCarousel from "../ArticleCarousel/ArticleCarousel";

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

  if (loading) return <p className="text-center">Cargando carruseles...</p>;

  return (
    <>
      {carousels.map((carousel) => (
        <ArticleCarousel
          key={carousel.id}
          beitragstypId={carousel.beitragstypId}
          region={carousel.regionId || null}
          title={carousel.titleES}
          limit={carousel.limit}
        />
      ))}
    </>
  );
}

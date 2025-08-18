"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import DonationBanner from "../DonationBanner/DonationBanner";
import Events from "../Events/Events";
import EntityBadges from "../EntityBadges/EntityBadges";
import MiniArticleCardGrid from "../Articles/MiniArticleCardGrid";
import { useTranslations, useLocale } from "next-intl";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";
import Slider from "../SafeSlick/SafeSlick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function LatestEditionWithArticles() {
  const [editions, setEditions] = useState([]);
  const [currentEditionIndex, setCurrentEditionIndex] = useState(0);
  const [articles, setArticles] = useState([]);
  const [editionsCount, setEditionsCount] = useState({});
  const [popupImage, setPopupImage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations("dossiers");

  const currentEdition = editions[currentEditionIndex];

  useEffect(() => {
    async function fetchAllEditions() {
      try {
        const res = await fetch("/api/editions?sort=desc");
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`API /api/editions fallo: ${res.status} ${msg}`);
        }

        const raw = await res.json();
        // Acepta tanto [...] como { editions: [...] }
        const data = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.editions)
            ? raw.editions
            : [];

        if (!Array.isArray(data)) {
          throw new Error("API /api/editions no devolvió un array.");
        }

        // Ordena SIEMPRE por number DESC (fallback)
        const byNumberDesc = [...data].sort((a, b) => {
          const an = typeof a?.number === "number" ? a.number : -Infinity;
          const bn = typeof b?.number === "number" ? b.number : -Infinity;
          return bn - an;
        });

        setEditions(byNumberDesc);

        if (byNumberDesc.length) {
          await fetchArticles(byNumberDesc[0].id);
          await fetchEditionsCount(byNumberDesc[0]);
          setCurrentEditionIndex(0);
        }
      } catch (e) {
        console.error("Error cargando ediciones:", e);
        setEditions([]);
      }
    }

    fetchAllEditions();
  }, []);

  useEffect(() => {
    if (editions[currentEditionIndex]) {
      fetchArticles(editions[currentEditionIndex].id);
      fetchEditionsCount(editions[currentEditionIndex]);
    }
  }, [currentEditionIndex]);

  async function fetchArticles(editionId) {
    const res = await fetch(`/api/articles/list?editionId=${editionId}`);
    const data = await res.json();
    setArticles(data.articles || []);
  }

  async function fetchEditionsCount(edition) {
    const regions = await Promise.all(
      edition.regions.map(async (region) => {
        const res = await fetch(
          `/api/count/regions/${region.id}?context=editions`
        );
        const data = await res.json();
        return { id: region.id, count: data.count };
      })
    );
    const topics = await Promise.all(
      edition.topics.map(async (topic) => {
        const res = await fetch(
          `/api/count/topics/${topic.id}?context=editions`
        );
        const data = await res.json();
        return { id: topic.id, count: data.count };
      })
    );
    setEditionsCount({
      regions: Object.fromEntries(regions.map(({ id, count }) => [id, count])),
      topics: Object.fromEntries(topics.map(({ id, count }) => [id, count])),
    });
  }

  const filteredArticles =
    locale === "es"
      ? articles.filter((a) => a.isTranslatedES && !a.needsReviewES)
      : articles;

  const mobileCarouselSettings = {
    infinite: filteredArticles.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: filteredArticles.length > 1,
    dots: true,
    swipe: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-0 sm:px-6 pb-16">
        {currentEdition && (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="relative w-full lg:w-1/3 flex items-start justify-center">
              <div className="bg-white shadow-lg p-2 pt-0 flex flex-col gap-4 items-center w-full max-w-sm">
                {/* Título + flechas */}
                <div className="relative w-full">
                  <div className="flex items-center justify-center">
                    {/* Flecha IZQUIERDA → ediciones más antiguas */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                      {currentEditionIndex < editions.length - 1 && (
                        <PrevArrow
                          onClick={() => setCurrentEditionIndex((i) => i + 1)}
                        />
                      )}
                    </div>

                    {/* Centro: número y datos de la edición */}
                    <div className="text-center mx-10 flex flex-col items-center space-y-1">
                      {/* línea: ila + número + fecha (súper compacta) */}
                      <div className="flex items-baseline justify-center gap-3 leading-none">
                        <span className="ila-edition font-bold text-[1.75rem] md:text-[2rem] leading-none">
                          ila {currentEdition.number}
                        </span>

                        {currentEdition.datePublished && (
                          <span className="font-bold text-xs md:text-sm text-black dark:text-white leading-none">
                            {new Date(currentEdition.datePublished)
                              .toLocaleDateString(
                                locale === "es" ? "es-ES" : "de-DE",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                              .replace(".", "")
                              .replace(/^\w/, (c) => c.toUpperCase())}
                          </span>
                        )}
                      </div>

                      {/* título del dossier */}
                      <div className="font-serif font-bold text-red-800 text-xl md:text-2xl leading-snug">
                        {locale === "es" && currentEdition.titleES
                          ? currentEdition.titleES
                          : currentEdition.title}
                      </div>
                    </div>

                    {/* Flecha DERECHA → ediciones más nuevas */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      {currentEditionIndex > 0 && (
                        <NextArrow
                          onClick={() => setCurrentEditionIndex((i) => i - 1)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Imagen de portada */}
                <div
                  className="relative w-full cursor-pointer"
                  onClick={() => {
                    if (currentEdition.coverImage) {
                      setPopupImage(currentEdition.coverImage);
                      setIsOpen(true);
                    }
                  }}
                >
                  <Image
                    src={currentEdition.coverImage}
                    alt={`Portada de ${currentEdition.title}`}
                    width={300}
                    height={400}
                    className="shadow-md object-cover w-full h-auto"
                    priority
                  />
                </div>

                <EntityBadges
                  regions={currentEdition.regions.map((region) => ({
                    ...region,
                    count: editionsCount.regions?.[region.id] || 0,
                  }))}
                  topics={currentEdition.topics.map((topic) => ({
                    ...topic,
                    count: editionsCount.topics?.[topic.id] || 0,
                  }))}
                  entityType="editions"
                  context="editions"
                  locale={locale}
                />

                <Link
                  href={`/editions/${currentEdition.id}`}
                  className="bg-white text-red-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition border border-red-600"
                >
                  {t("editorialButton")}
                </Link>

                {/* Solo escritorio */}
                <div className="hidden lg:flex flex-col gap-4 w-full">
                  <DonationBanner />
                  <Events />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              {/* Artículos en escritorio */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <MiniArticleCardGrid key={article.id} article={article} />
                  ))
                ) : (
                  <p className="text-gray-500 col-span-full">
                    {t("noArticlesInEdition")}
                  </p>
                )}
              </div>

              {/* Artículos en móvil */}
              {/* Franja de conexión visual */}
              {/* Franja de conexión visual mejorada */}
              <div className="block lg:hidden w-full bg-red-50 text-center py-3 rounded-t shadow-sm border-t border-b border-red-200">
                <span className="text-sm text-red-800 font-semibold tracking-wide">
                  ⬇ {t("articlesFromDossier")}{" "}
                  <span className="italic">
                    &quot;{currentEdition.title}&quot;
                  </span>
                </span>
              </div>
              <div className="block lg:hidden w-full mt-0">
                {filteredArticles.length > 0 ? (
                  <Slider {...mobileCarouselSettings}>
                    {filteredArticles.map((article) => (
                      <div key={article.id} className="w-full">
                        <MiniArticleCardGrid article={article} />
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <p className="text-gray-500">{t("noArticlesInEdition")}</p>
                )}
              </div>

              {/* Banner y eventos en móvil */}
              <div className="block lg:hidden w-full mt-6 space-y-4">
                <DonationBanner />
                <Events />
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      >
        <Dialog.Panel className="relative bg-white rounded-lg shadow-lg p-4 max-w-[500px]">
          {popupImage && (
            <Image
              src={popupImage}
              alt={`Portada de ${currentEdition?.title}`}
              width={400}
              height={520}
              className="rounded-lg object-contain w-full h-auto"
              priority
            />
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-800 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full"
          >
            ✕
          </button>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

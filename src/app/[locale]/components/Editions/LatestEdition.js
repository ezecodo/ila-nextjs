"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";

import EntityBadges from "../EntityBadges/EntityBadges";
import MiniArticleCard from "../Articles/MiniArticleCard";
import { useTranslations, useLocale } from "next-intl";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";

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
        const response = await fetch("/api/editions?sort=desc");
        const data = await response.json();
        setEditions(data);
        if (data.length) {
          fetchArticles(data[0].id);
          fetchEditionsCount(data[0]);
        }
      } catch (error) {
        console.error("Error cargando ediciones", error);
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

  return (
    <>
      <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 px-4 py-4 rounded mb-6 text-center">
        {currentEdition && (
          <div className="flex flex-wrap justify-center items-center gap-4 text-[1.25rem] md:text-[1.5rem] leading-snug">
            {/* Bloque ILA + Fecha */}
            <div className="flex flex-col items-center">
              <span className="ila-edition font-bold text-[1.75rem] md:text-[2rem]">
                ila {currentEdition.number}
              </span>
              {currentEdition.datePublished && (
                <span className="text-sm text-gray-500 dark:text-gray-400 -mt-1">
                  {new Date(currentEdition.datePublished)
                    .toLocaleDateString(locale === "es" ? "es-ES" : "de-DE", {
                      month: "short",
                      year: "numeric",
                    })
                    .replace(".", "")
                    .replace(/^\w/, (c) => c.toUpperCase())}
                </span>
              )}
            </div>

            {/* Bloque Dossier */}
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-black dark:text-white">
                Dossier:
              </span>
              <span className="font-serif font-bold text-red-800">
                {currentEdition.title}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {currentEdition && (
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* PORTADA DE LA EDICIÓN */}
            <div className="relative w-full lg:w-1/3 flex justify-center">
              <div className="relative w-full max-w-sm">
                {/* Flecha izquierda */}
                <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 z-20">
                  <PrevArrow
                    onClick={() =>
                      currentEditionIndex > 0 &&
                      setCurrentEditionIndex((prev) => prev - 1)
                    }
                    className={
                      currentEditionIndex === 0
                        ? "opacity-40 pointer-events-none"
                        : ""
                    }
                  />
                </div>

                {/* Tarjeta de portada */}
                <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col gap-4 items-center">
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
                      className="rounded-lg shadow-md object-cover w-full h-auto"
                      priority
                    />
                  </div>

                  {/* Badges */}
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
                  />

                  {/* Botón de acceso */}
                  <Link
                    href={`/editions/${currentEdition.id}`}
                    className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition"
                  >
                    {t("viewEdition")}
                  </Link>
                </div>

                {/* Flecha derecha */}
                <div className="absolute right-0 top-1/2 translate-x-full -translate-y-1/2 z-20">
                  <NextArrow
                    onClick={() =>
                      currentEditionIndex < editions.length - 1 &&
                      setCurrentEditionIndex((prev) => prev + 1)
                    }
                    className={
                      currentEditionIndex === editions.length - 1
                        ? "opacity-40 pointer-events-none"
                        : ""
                    }
                  />
                </div>
              </div>
            </div>

            {/* ARTÍCULOS DE LA EDICIÓN */}
            <div className="w-full lg:w-2/3 space-y-3">
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <MiniArticleCard key={article.id} article={article} />
                ))
              ) : (
                <p className="text-gray-500">{t("noArticlesInEdition")}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE IMAGEN */}
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

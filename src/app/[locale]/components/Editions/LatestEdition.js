"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import HoverInfo from "../HoverInfo/HoverInfo";
import EntityBadges from "../EntityBadges/EntityBadges";
import ArticleCard from "../Articles/ArticleCard";
import { useTranslations, useLocale } from "next-intl";

export default function LatestEditionWithArticles() {
  const [editions, setEditions] = useState([]);
  const [currentEditionIndex, setCurrentEditionIndex] = useState(0);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editionsCount, setEditionsCount] = useState({});
  const articlesPerPage = 3;
  const t = useTranslations("dossiers");
  const ta = useTranslations("article");
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  const currentEdition = editions[currentEditionIndex];

  useEffect(() => {
    async function fetchAllEditions() {
      try {
        const response = await fetch("/api/editions?sort=desc");
        if (!response.ok) throw new Error(t("errorLastEdition"));

        const data = await response.json();
        if (data.length > 0) {
          setEditions(data);
          setCurrentEditionIndex(0);
          fetchArticles(data[0].id);
          fetchEditionsCount(data[0]);
        } else {
          setError("No hay ediciones disponibles.");
        }
      } catch (err) {
        setError(err.message);
      }
    }

    fetchAllEditions();
  }, []);

  async function fetchArticles(editionId) {
    try {
      const response = await fetch(`/api/articles/list?editionId=${editionId}`);
      if (!response.ok) throw new Error(ta("loadingArticlesError"));
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function fetchEditionsCount(edition) {
    try {
      const regionsCounts = await Promise.all(
        edition.regions.map(async (region) => {
          const res = await fetch(
            `/api/count/regions/${region.id}?context=editions`
          );
          const data = await res.json();
          return { id: region.id, count: data.count };
        })
      );

      const topicsCounts = await Promise.all(
        edition.topics.map(async (topic) => {
          const res = await fetch(
            `/api/count/topics/${topic.id}?context=editions`
          );
          const data = await res.json();
          return { id: topic.id, count: data.count };
        })
      );

      setEditionsCount({
        regions: Object.fromEntries(
          regionsCounts.map(({ id, count }) => [id, count])
        ),
        topics: Object.fromEntries(
          topicsCounts.map(({ id, count }) => [id, count])
        ),
      });
    } catch (error) {
      console.error("Error al obtener conteo de ediciones:", error);
    }
  }

  const handleEditionChange = (newIndex) => {
    setCurrentEditionIndex(newIndex);
    fetchArticles(editions[newIndex].id);
    fetchEditionsCount(editions[newIndex]);
    setCurrentPage(1);
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!currentEdition)
    return <p className="text-gray-500">{t("loadLastEdition")}</p>;

  const filteredArticles =
    locale === "es"
      ? articles.filter((a) => a.isTranslatedES && !a.needsReviewES)
      : articles;

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(
    indexOfFirstArticle,
    indexOfLastArticle
  );

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Columna Izquierda: Portada */}
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center w-full md:w-1/3">
        <div
          className="relative w-full max-w-[300px] cursor-pointer"
          onClick={() => {
            if (currentEdition.coverImage) {
              setPopupImage(currentEdition.coverImage);
              setIsOpen(true);
            }
          }}
        >
          <div className="relative overflow-hidden aspect-w-3 aspect-h-4">
            <Image
              src={currentEdition.coverImage}
              alt={`Portada de ${currentEdition.title}`}
              width={300}
              height={400}
              priority
              objectFit="contain"
              className="rounded-lg shadow-md"
            />

            {currentEdition.isAvailableToOrder && (
              <div className="absolute top-2 right-2 z-10">
                <i className="fa fa-shopping-cart text-white text-xl bg-red-600 p-1 shadow-lg hover:bg-red-800 hover:scale-110"></i>
              </div>
            )}
          </div>
        </div>

        <HoverInfo
          id={currentEdition.id}
          name={
            <h2 className="text-lg font-bold mt-4 mb-2 flex items-center gap-2">
              <span className="text-red-600 text-xl font-bold">
                ila {currentEdition.number}
              </span>
              {currentEdition.title}
            </h2>
          }
          entityType="editions"
        />

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

        {/* Navegación de ediciones + Ver edición */}
        <div className="flex justify-between items-center mt-4 gap-2 w-full">
          <button
            onClick={() => handleEditionChange(currentEditionIndex + 1)}
            disabled={currentEditionIndex >= editions.length - 1}
            className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          >
            ←
          </button>

          <Link
            href={`/editions/${currentEdition.id}`}
            className="bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800 transition"
          >
            {t("viewEdition")}
          </Link>

          <button
            onClick={() => handleEditionChange(currentEditionIndex - 1)}
            disabled={currentEditionIndex <= 0}
            className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
          >
            →
          </button>
        </div>
      </div>

      {/* Columna Derecha: Artículos */}
      <div className="w-full md:w-2/3 flex flex-col gap-4">
        {currentArticles.length > 0 ? (
          currentArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <p className="text-gray-500">{t("noArticlesInEdition")}</p>
        )}

        {filteredArticles.length > articlesPerPage && (
          <div className="flex justify-center mt-4 gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              ←
            </button>
            <button
              disabled={indexOfLastArticle >= filteredArticles.length}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Modal de imagen grande */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-[1100] flex items-center justify-center bg-black bg-opacity-70"
      >
        <Dialog.Panel className="relative bg-white rounded-lg shadow-lg p-4 max-w-[500px]">
          {popupImage && (
            <Image
              src={popupImage}
              alt="Imagen ampliada"
              width={500}
              height={700}
              objectFit="contain"
            />
          )}
          <button
            className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-800 text-xl font-bold w-8 h-8 flex items-center justify-center shadow-lg"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}

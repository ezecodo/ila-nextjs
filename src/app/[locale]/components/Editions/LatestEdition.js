"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import HoverInfo from "../HoverInfo/HoverInfo";
import EntityBadges from "../EntityBadges/EntityBadges";
import ArticleCard from "../Articles/ArticleCard";
import { useTranslations } from "next-intl";

export default function LatestEditionWithArticles() {
  const [latestEdition, setLatestEdition] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editionsCount, setEditionsCount] = useState({});
  const articlesPerPage = 3;
  const t = useTranslations("dossiers");
  const ta = useTranslations("article");

  // Estado para el popup de la imagen
  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  useEffect(() => {
    async function fetchLatestEdition() {
      try {
        const response = await fetch("/api/editions?limit=1&sort=desc");
        if (!response.ok) {
          throw new Error(t("errorLastEdition"));
        }
        const data = await response.json();
        if (data.length > 0) {
          setLatestEdition(data[0]);
          fetchArticles(data[0].id);
          fetchEditionsCount(data[0]);
        } else {
          setError("No hay ediciones disponibles.");
        }
      } catch (err) {
        setError(err.message);
      }
    }

    async function fetchArticles(editionId) {
      try {
        const response = await fetch(
          `/api/articles/list?editionId=${editionId}`
        );
        if (!response.ok) {
          throw new Error(ta("loadingArticlesError"));
        }
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

    fetchLatestEdition();
  }, []);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!latestEdition) {
    return <p className="text-gray-500">{t("loadLastEdition")}</p>;
  }

  // Cálculo de paginación
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(
    indexOfFirstArticle,
    indexOfLastArticle
  );

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* 🔹 Columna Izquierda: Última Edición */}
      <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center w-full md:w-1/3">
        <div
          className="relative w-full max-w-[300px] cursor-pointer"
          onClick={() => {
            if (latestEdition.coverImage) {
              setPopupImage(latestEdition.coverImage);
              setIsOpen(true);
            }
          }}
        >
          <div className="relative overflow-hidden aspect-w-3 aspect-h-4">
            <Image
              src={latestEdition.coverImage}
              alt={`Portada de ${latestEdition.title}`}
              width={300}
              height={400}
              priority={true}
              objectFit="contain"
              className="rounded-lg shadow-md"
            />

            {/* 🔥 Ícono del carrito (solo si está disponible para compra) */}
            {latestEdition.isAvailableToOrder && (
              <div className="absolute top-2 right-2 z-10">
                <i className="fa fa-shopping-cart text-white text-xl bg-red-600 p-1 shadow-lg transition-all duration-200 ease-in-out hover:bg-red-800 hover:scale-110"></i>
              </div>
            )}
          </div>
        </div>

        <HoverInfo
          id={latestEdition.id}
          name={
            <h2 className="text-lg font-bold mt-4 mb-2 flex items-center gap-2">
              <span className="text-red-600 text-xl font-bold">
                ila {latestEdition.number}
              </span>
              {latestEdition.title}
            </h2>
          }
          entityType="editions"
        />

        {/* 🔹 Badges de regiones y temas con conteo corregido */}
        <EntityBadges
          regions={latestEdition.regions.map((region) => ({
            ...region,
            count: editionsCount.regions?.[region.id] || 0,
          }))}
          topics={latestEdition.topics.map((topic) => ({
            ...topic,
            count: editionsCount.topics?.[topic.id] || 0,
          }))}
          entityType="editions"
          context="editions"
        />

        <Link
          href={`/editions/${latestEdition.id}`}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800 transition"
        >
          Ver edición
        </Link>
      </div>

      {/* 🔹 Columna Derecha: Artículos de la edición */}
      <div className="w-full md:w-2/3 flex flex-col gap-4">
        {currentArticles.length > 0 ? (
          currentArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <p className="text-gray-500">{t("noArticlesInEdition")}</p>
        )}

        {/* 🔹 Paginación */}
        {articles.length > articlesPerPage && (
          <div className="flex justify-center mt-4 gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              ←
            </button>
            <button
              disabled={indexOfLastArticle >= articles.length}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* 🔹 Modal para ver imagen en grande */}
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

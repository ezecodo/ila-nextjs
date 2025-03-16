"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import HoverInfo from "../HoverInfo/HoverInfo";
import EntityBadges from "../EntityBadges/EntityBadges";
import ArticleCard from "../Articles/ArticleCard"; // Importar el componente de artículos

export default function LatestEditionWithArticles() {
  const [latestEdition, setLatestEdition] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editionsCount, setEditionsCount] = useState({}); // 🔥 Almacenar el conteo de ediciones por región y tema
  const articlesPerPage = 3;

  useEffect(() => {
    async function fetchLatestEdition() {
      try {
        const response = await fetch("/api/editions?limit=1&sort=desc");
        if (!response.ok) {
          throw new Error("Error al cargar la última edición");
        }
        const data = await response.json();
        if (data.length > 0) {
          setLatestEdition(data[0]); // Guardamos la última edición
          fetchArticles(data[0].id); // Llamar a fetchArticles con el ID de la edición
          fetchEditionsCount(data[0]); // Llamar a fetchEditionsCount para obtener el conteo
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
          throw new Error("Error al cargar los artículos");
        }
        const data = await response.json();
        setArticles(data.articles || []); // Guardamos los artículos de la edición
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
    return <p className="text-gray-500">Cargando la última edición...</p>;
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
        <div className="relative w-full max-w-[300px]">
          <Image
            src={latestEdition.coverImage}
            alt={`Portada de ${latestEdition.title}`}
            width={300}
            height={400}
            priority={true}
            objectFit="contain"
            className="rounded-lg shadow-md"
          />
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

        {/* 🔹 Badges de regiones y temas con conteo correcto */}
        <div className="flex flex-wrap gap-2 mt-2">
          {latestEdition.regions.map((region) => (
            <HoverInfo
              key={region.id}
              id={region.id}
              name={
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                  {region.name} ({editionsCount.regions?.[region.id] || 0}{" "}
                  ediciones)
                </span>
              }
              entityType="regions"
            />
          ))}
          {latestEdition.topics.map((topic) => (
            <HoverInfo
              key={topic.id}
              id={topic.id}
              name={
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs">
                  {topic.name} ({editionsCount.topics?.[topic.id] || 0}{" "}
                  ediciones)
                </span>
              }
              entityType="topics"
            />
          ))}
        </div>

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
          <p className="text-gray-500">
            No hay artículos disponibles en esta edición.
          </p>
        )}

        {/* 🔹 Paginación */}
        {articles.length > articlesPerPage && (
          <div className="flex justify-center mt-4 gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              disabled={indexOfLastArticle >= articles.length}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

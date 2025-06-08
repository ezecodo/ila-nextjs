"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CartButton from "../../components/CartButton/CartButton";
import { useTranslations } from "next-intl";

export default function EditionDetails() {
  const { id } = useParams();
  const [edition, setEdition] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const t = useTranslations("dossiers");

  useEffect(() => {
    if (!id) return;

    async function fetchEditionAndArticles() {
      try {
        const res = await fetch(`/api/editions/${id}`);
        if (!res.ok) throw new Error("Error al cargar la edición");
        const data = await res.json();
        setEdition(data);

        const articlesRes = await fetch(`/api/articles/edition/${data.number}`);
        const articlesData = await articlesRes.json();
        setArticles(articlesData);
      } catch (err) {
        setError(err.message);
      }
    }

    fetchEditionAndArticles();
  }, [id]);

  function renderTableOfContents() {
    if (!edition?.tableOfContents) return null;

    return edition.tableOfContents.split("\n").map((line, index) => {
      const matchedArticle = articles.find((article) =>
        line.toLowerCase().includes(article.title.toLowerCase())
      );

      const isLinked = Boolean(matchedArticle);

      return (
        <div
          key={index}
          className={`flex justify-between items-center px-4 py-2 border-b ${
            isLinked ? "hover:bg-gray-50 transition" : ""
          }`}
        >
          <div
            className={`text-sm md:text-base ${
              isLinked ? "text-blue-700 font-medium" : "text-gray-800"
            }`}
          >
            {isLinked ? (
              <Link
                href={`/articles/${matchedArticle.id}`}
                className="flex items-center gap-2 hover:underline"
              >
                <span>{line}</span>
                <span>🔗</span>
              </Link>
            ) : (
              line
            )}
          </div>
        </div>
      );
    });
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!edition) return <p>Cargando edición...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col items-center mb-6">
        <h1
          className="text-3xl font-bold text-gray-800 mb-4 text-center"
          style={{ fontFamily: "Futura" }}
        >
          {`ila ${edition.number}: ${edition.title}`}
        </h1>

        <div className="relative max-w-[550px] mb-4">
          <Image
            src={edition.coverImage}
            alt={`Portada de ${edition.title}`}
            width={550}
            height={700}
            objectFit="contain"
          />

          <div className="badgesContainer">
            {edition.regions.length > 0 ? (
              edition.regions.map((region) => (
                <span key={region.id} className="regionBadge">
                  {region.name}
                </span>
              ))
            ) : (
              <span className="regionBadge">Sin regiones asociadas</span>
            )}
          </div>

          <div className="badgesContainer">
            {edition.topics.length > 0 ? (
              edition.topics.map((topic) => (
                <span key={topic.id} className="topicBadge">
                  {topic.name}
                </span>
              ))
            ) : (
              <span className="topicBadge">Sin temas asociados</span>
            )}
          </div>

          {edition.isAvailableToOrder && (
            <CartButton
              onClick={() => console.log("Añadido al carrito")}
              className="ml-2"
            />
          )}
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        Publicado el{" "}
        {new Date(edition.datePublished).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="text-gray-700 mb-6">
        {edition.summary
          ? edition.summary.split("\n").map((line, index) => (
              <p key={index} className="mb-4">
                {line}
              </p>
            ))
          : "Sin resumen"}
      </div>

      {/* 📚 Tabla de contenidos */}
      {edition.tableOfContents && (
        <div className="my-8">
          <h2 className="text-xl font-bold mb-4 border-b pb-1">
            {t("tableOfContents")}
          </h2>
          <div className="rounded-md shadow-sm border border-gray-200 divide-y">
            {renderTableOfContents()}
          </div>
        </div>
      )}

      <Link
        href="/editions"
        className="mt-4 inline-block bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-800 transition"
      >
        Volver a las ediciones
      </Link>
    </div>
  );
}

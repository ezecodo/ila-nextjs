"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import SectionHeader from "../SectionsHeader/SetionHeader";
import Image from "next/image";

interface Aktuelles {
  id: number;
  title: string;
  titleES: string | null;
  content: string;
  contentES: string | null;
  date: string;
  link: string | null;
  createdAt: string;
  images?: {
    id: number;
    url: string;
    alt: string | null;
    title: string | null;
  }[];
}

export default function AktuellesList() {
  const locale = useLocale();
  const [items, setItems] = useState<Aktuelles[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/aktuelles")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading Aktuelles:", err);
        setLoading(false);
      });
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTitle = (item: Aktuelles) => {
    return locale === "es" && item.titleES ? item.titleES : item.title;
  };

  const getContent = (item: Aktuelles) => {
    return locale === "es" && item.contentES ? item.contentES : item.content;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "es" ? "es-ES" : "de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📰</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {locale === "es"
              ? "No hay noticias disponibles en este momento"
              : "Derzeit sind keine Nachrichten verfügbar"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-2 pb-16 px-4">
      {/* Cabecera */}
      <SectionHeader
        title={locale === "es" ? "Actualidad" : "Aktuelles"}
        className="mb-2"
      />

      {/* Lista de Aktuelles */}
      <div className="space-y-8">
        {items.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          const content = getContent(item);
          const showReadMore = content.length > 300;
          const coverImage = item.images?.[0];

          return (
            <article
              key={item.id}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                {/* Fecha en formato destacado */}
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg font-semibold">
                  {formatDate(item.date)}
                </div>
              </div>
              {/* Imagen de portada */}
              {coverImage && (
                <Image
                  src={coverImage.url}
                  alt={coverImage.alt || getTitle(item)}
                  width={800}
                  height={400}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-4">
                {/* Encabezado con fecha y badge */}

                {/* Título */}
                <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                  {getTitle(item)}
                </h2>

                {/* Línea decorativa */}
                <div className="w-20 h-1 bg-red-600 dark:bg-red-500 mb-6 rounded-full"></div>

                {/* Contenido */}
                <div
                  className="prose prose-lg max-w-none
                             text-gray-700 dark:text-gray-300
                             dark:prose-headings:text-gray-100
                             dark:prose-strong:text-gray-100
                             dark:prose-a:text-red-400
                             prose-a:text-red-600
                             mb-6"
                  dangerouslySetInnerHTML={{
                    __html: isExpanded ? content : truncateText(content),
                  }}
                />

                {/* Botón Leer más y acciones */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                  {showReadMore && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 
                                 text-white font-semibold px-6 py-3 rounded-lg 
                                 transition-all duration-300 hover:shadow-lg
                                 inline-flex items-center gap-2"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? (
                        <>
                          {locale === "es" ? "Leer menos" : "Weniger lesen"}
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </>
                      ) : (
                        <>
                          {locale === "es" ? "Leer más" : "Weiterlesen"}
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </>
                      )}
                    </button>
                  )}

                  {/* Enlace externo si existe */}
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 
                                 font-medium inline-flex items-center gap-2 transition-colors"
                    >
                      {locale === "es" ? "Enlace externo" : "Externer Link"}
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

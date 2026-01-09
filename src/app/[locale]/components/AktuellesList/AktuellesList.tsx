"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import SectionHeader from "../SectionsHeader/SetionHeader";
import IlaLoader from "../IlaLoader/IlaLoader";
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

  const searchParams = useSearchParams();

  // Leer id de URL y expandir/scroll al Aktuelles correspondiente
  useEffect(() => {
    if (loading || items.length === 0) return;

    const id = searchParams.get("id");
    if (id) {
      const numId = parseInt(id, 10);
      setExpandedIds((prev) => new Set(prev).add(numId));

      // Esperar a que todas las imágenes carguen
      const scrollToElement = () => {
        const element = document.getElementById(`aktuelles-${numId}`);
        if (element) {
          const yOffset = -20;
          const y =
            element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      };

      // Verificar si hay imágenes y esperar a que carguen
      const images = document.querySelectorAll("article img");
      if (images.length > 0) {
        let loadedCount = 0;
        const checkAllLoaded = () => {
          loadedCount++;
          if (loadedCount >= images.length) {
            setTimeout(scrollToElement, 100);
          }
        };

        images.forEach((img) => {
          if ((img as HTMLImageElement).complete) {
            checkAllLoaded();
          } else {
            img.addEventListener("load", checkAllLoaded);
            img.addEventListener("error", checkAllLoaded);
          }
        });

        // Fallback por si algo falla
        setTimeout(scrollToElement, 2000);
      } else {
        setTimeout(scrollToElement, 500);
      }
    }
  }, [loading, items, searchParams]);

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
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
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
        className="mb-8"
      />

      {/* Lista de Aktuelles */}
      <div className="space-y-12">
        {items.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          const content = getContent(item);
          const showReadMore = content.length > 300;
          const coverImage = item.images?.[0];

          return (
            <article
              key={item.id}
              id={`aktuelles-${item.id}`}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Fecha encima de la imagen */}
              <div className="px-6 pt-6 pb-2">
                <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-full border border-red-100 dark:border-red-900/50">
                  {formatDate(item.date)}
                </span>
              </div>

              {/* --- IMAGEN --- */}
              {coverImage && (
                <div className="relative w-full bg-stone-50 dark:bg-stone-900/30 p-6 flex justify-center items-center">
                  <div className="relative shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                    <Image
                      src={coverImage.url}
                      alt={coverImage.alt || getTitle(item)}
                      width={800}
                      height={800}
                      className="max-h-[600px] w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="p-8 md:p-10">
                {/* Meta - link externo si existe */}
                <div
                  style={{ scrollMarginTop: "100px" }}
                  className="flex items-center gap-3 mb-6"
                >
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <svg
                        className="w-3 h-3"
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
                      {locale === "es" ? "Fuente externa" : "Externe Quelle"}
                    </a>
                  )}
                </div>

                {/* Título */}
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                  {getTitle(item)}
                </h2>

                {/* Línea decorativa */}
                <div className="w-16 h-0.5 bg-gradient-to-r from-red-600 to-transparent mb-8"></div>

                {/* Contenido */}
                <div
                  className="prose prose-lg max-w-none 
                             prose-headings:font-serif 
                             prose-p:text-gray-600 dark:prose-p:text-gray-300 
                         
                             prose-a:no-underline 
                            
                             prose-a:hover:underline 
                            
                             prose-a:hover:underline-offset-4 
                           
                             prose-a:hover:decoration-red-600/50
                             
                            
                             prose-u:decoration-transparent
                             
                           
                             prose-strong:text-gray-900 dark:prose-strong:text-white
                             mb-8 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: isExpanded ? content : truncateText(content),
                  }}
                />

                {/* Botón Leer más */}
                {showReadMore && (
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="group inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-500 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          {locale === "es" ? "Contraer" : "Einklappen"}
                          <svg
                            className="w-4 h-4 transform rotate-180 transition-transform group-hover:rotate-0"
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
                          {locale === "es"
                            ? "Leer artículo completo"
                            : "Artikel vollständig lesen"}
                          <svg
                            className="w-4 h-4 transform transition-transform group-hover:translate-y-1"
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
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import QuietSectionHeader from "../SectionsHeader/QuietSectionHeader";
import IlaLoader from "../IlaLoader/IlaLoader";
import Image from "next/image";

interface Aktuelles {
  id: number;
  title: string;
  titleES: string | null;
  subtitle: string | null;
  subtitleES: string | null;
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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupByYear(items: Aktuelles[]): [string, Aktuelles[]][] {
  const groups: Record<string, Aktuelles[]> = {};
  items.forEach((item) => {
    const year = new Date(item.date).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => parseInt(b) - parseInt(a));
}

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);


export default function AktuellesList() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [items, setItems] = useState<Aktuelles[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(56);
  const [lightbox, setLightbox] = useState<{ url: string; alt: string; title: string | null } | null>(null);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setHeaderHeight(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/aktuelles")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Restaurar scroll position (lógica original intacta)
  useEffect(() => {
    if (loading || items.length === 0) return;
    const scrollToId = searchParams.get("scrollTo");
    if (!scrollToId) return;
    const numId = parseInt(scrollToId, 10);
    setExpandedIds((prev) => new Set(prev).add(numId));

    const scrollToElement = () => {
      const dateElement = document.getElementById(`aktuelles-date-${numId}`);
      if (dateElement) {
        const header = document.querySelector("header");
        const headerHeight = header ? header.offsetHeight + 20 : 120;
        const scrollPosition = Math.max(
          0,
          dateElement.getBoundingClientRect().top + window.pageYOffset - headerHeight
        );
        window.scrollTo({ top: scrollPosition, behavior: "smooth" });
        return;
      }
      const articleElement = document.getElementById(`aktuelles-${numId}`);
      if (articleElement) {
        const scrollPosition = Math.max(
          0,
          articleElement.getBoundingClientRect().top + window.pageYOffset - 100
        );
        window.scrollTo({ top: scrollPosition, behavior: "smooth" });
      }
    };

    const isProduction = process.env.NODE_ENV === "production";
    setTimeout(scrollToElement, isProduction ? 800 : 500);
    setTimeout(() => {
      router.replace("/aktuell/aktuelles", { scroll: false });
    }, 1500);
  }, [loading, items, searchParams, router]);

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const getTitle = (item: Aktuelles) =>
    locale === "es" && item.titleES ? item.titleES : item.title;

  const getSubtitle = (item: Aktuelles) =>
    locale === "es" && item.subtitleES ? item.subtitleES : item.subtitle;

  const getContent = (item: Aktuelles) =>
    locale === "es" && item.contentES ? item.contentES : item.content;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === "es" ? "es-ES" : "de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          {locale === "es"
            ? "No hay noticias disponibles en este momento"
            : "Derzeit sind keine Nachrichten verfügbar"}
        </p>
      </div>
    );
  }

  const yearGroups = groupByYear(items);

  return (
    <>
      <div
        className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 z-40 bg-white dark:bg-gray-900"
        style={{ position: "sticky", top: headerHeight - 1 }}
      >
        <QuietSectionHeader
          variant="chip"
          title={locale === "es" ? "Actualidad" : "Aktuelles"}
          className="px-4 sm:px-6 lg:px-8 pt-3 mb-0"
        />
      </div>
    <div className="max-w-6xl mx-auto pt-4 pb-16 px-1 sm:px-6">

      {/* ── GRUPOS POR AÑO + TIMELINE ────────────────────────────────── */}
      {yearGroups.map(([year, yearItems]) => (
        <div key={year} className="mb-14">
          {/* Separador de año */}
          <div className="flex items-center gap-4 mb-8">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {year}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Timeline */}
          <div className="relative border-l-2 border-red-200 dark:border-red-900/50 pl-3 sm:pl-8 space-y-8">
            {yearItems.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              const content = getContent(item);
              const plain = stripHtml(content);
              const hasMore = plain.length > 300;
              const subtitle = getSubtitle(item);
              const images = item.images ?? [];

              return (
                <article
                  key={item.id}
                  id={`aktuelles-${item.id}`}
                  className="relative"
                >
                  {/* Dot en la línea */}
                  <div className="absolute -left-[19px] sm:-left-[2.5rem] top-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-red-600 border-2 border-white dark:border-gray-900 shadow-sm" />

                  {/* Fecha */}
                  <div id={`aktuelles-date-${item.id}`} className="mb-2">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {/* Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
                    <div className="flex flex-col">
                      {/* Imágenes encima del contenido */}
                      {images.length > 0 && (
                        <div className={`w-full bg-stone-100 dark:bg-stone-900 px-4 pt-4 ${images.length > 1 ? "grid grid-cols-2 gap-3" : "flex flex-col"}`}>
                          {images.map((img) => (
                            <div key={img.id} className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => setLightbox({ url: img.url, alt: img.alt || getTitle(item), title: img.title })}
                                className="cursor-zoom-in focus:outline-none"
                              >
                              <Image
                                src={img.url}
                                alt={img.alt || getTitle(item)}
                                width={images.length > 1 ? 350 : 700}
                                height={300}
                                className="w-full h-auto max-h-[280px] object-contain rounded-md hover:opacity-90 transition-opacity"
                                sizes={images.length > 1 ? "(max-width: 768px) 50vw, 350px" : "(max-width: 768px) 100vw, 700px"}
                              />
                              </button>
                              {(img.alt || img.title) && (
                                <div className="mt-1 mb-2 text-center space-y-0.5">
                                  {img.alt && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                      {img.alt}
                                    </p>
                                  )}
                                  {img.title && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      © {img.title}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-3 sm:p-6 flex-1 min-w-0">
                        {/* Título + link externo */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                            {getTitle(item)}
                          </h3>
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors mt-0.5"
                              title={locale === "es" ? "Fuente externa" : "Externe Quelle"}
                            >
                              <ExternalLinkIcon />
                            </a>
                          )}
                        </div>

                        {subtitle && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
                            {subtitle}
                          </p>
                        )}

                        {/* Contenido */}
                        <div
                          className="prose prose-base max-w-none prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline"
                          dangerouslySetInnerHTML={{
                            __html: isExpanded || !hasMore ? content : plain.slice(0, 300) + "...",
                          }}
                        />

                        {hasMore && (
                          <button
                            onClick={() => toggleExpand(item.id)}
                            className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors flex items-center gap-1"
                          >
                            {isExpanded
                              ? (locale === "es" ? "↑ Contraer" : "↑ Einklappen")
                              : (locale === "es" ? "Leer más →" : "Mehr lesen →")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white text-3xl leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
            <Image
              src={lightbox.url}
              alt={lightbox.alt}
              width={1200}
              height={800}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            {(lightbox.alt || lightbox.title) && (
              <div className="mt-3 text-center space-y-0.5">
                {lightbox.alt && (
                  <p className="text-white/80 text-sm italic">{lightbox.alt}</p>
                )}
                {lightbox.title && (
                  <p className="text-white/60 text-sm">© {lightbox.title}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

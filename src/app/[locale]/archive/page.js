"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import IlaLoader from "../components/IlaLoader/IlaLoader";
import IlaLogo from "../components/IlaLogo/IlaLogo";

export default function ArchivePage() {
  const locale = useLocale();
  const isES = locale === "es";

  const [editionsByYear, setEditionsByYear] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredEdition, setHoveredEdition] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [expandedYears, setExpandedYears] = useState({});

  useEffect(() => {
    async function fetchEditions() {
      try {
        const res = await fetch("/api/editions/archive");
        const data = await res.json();

        const grouped = data.reduce((acc, edition) => {
          const year = new Date(edition.datePublished).getFullYear();
          if (!acc[year]) acc[year] = [];
          acc[year].push(edition);
          return acc;
        }, {});

        Object.keys(grouped).forEach((year) => {
          grouped[year].sort((a, b) => b.number - a.number);
        });

        setEditionsByYear(grouped);

        const sortedYearsList = Object.keys(grouped).sort((a, b) => b - a);
        const recent = sortedYearsList.slice(0, 0);
        const initialExpanded = recent.reduce((acc, year) => {
          acc[year] = true;
          return acc;
        }, {});
        setExpandedYears(initialExpanded);
      } catch (error) {
        console.error("Error fetching editions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEditions();
  }, []);

  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      if (prev[year]) {
        return {};
      }
      return { [year]: true };
    });

    // Scroll suave al botón del año
    setTimeout(() => {
      const yearElement = document.getElementById(`year-${year}`);
      if (yearElement) {
        const offset = 150;
        const elementPosition = yearElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <IlaLoader />
      </div>
    );
  }

  const years = Object.keys(editionsByYear).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-white selection:bg-red-200 relative">
      {/* Patrón de fondo muy sutil */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />

      <main className="relative z-10 max-w-6xl mx-auto pl-4 md:pl-12 pr-6 pt-2 md:pt-4 pb-8 md:pb-16">
        {/* --- CABECERA MINIMALISTA --- */}
        <header className="flex items-center gap-3 mb-0 pb-4 pl-4 md:border-l-4 border-[#e60000] relative ml-8 md:ml-28">
          <IlaLogo size="mini" variant="black-solid" isLink={false} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Jahrgänge
          </h1>
        </header>

        <div className="relative ml-8 md:ml-16 pt-0">
          {/* Línea vertical roja (Solo desktop) - CONECTADA */}
          <div className="hidden md:block absolute left-[48px] top-0 bottom-0 w-1 bg-[#e60000]" />

          {years.map((year) => {
            const editions = editionsByYear[year];
            const isExpanded = expandedYears[year];

            return (
              <div key={year} className="mb-8 md:mb-16 relative">
                {/* --- BOTÓN AÑO --- */}
                <div className="flex items-center gap-4 mb-4 md:mb-8 relative z-20">
                  {/* Círculo en línea (Solo desktop) - CENTRADO EN LÍNEA */}
                  <div
                    className={`hidden md:block absolute left-[48px] w-6 h-6 -ml-[11px] rounded-full shadow-md border-4 border-[#e60000] transition-colors duration-300 ${
                      isExpanded ? "bg-[#e60000]" : "bg-white"
                    }`}
                  />

                  <button
                    id={`year-${year}`}
                    onClick={() => toggleYear(year)}
                    className="w-full md:w-auto md:ml-20 group flex items-center justify-between md:justify-start gap-3 bg-white px-6 py-3 rounded-xl md:rounded-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-[#e60000]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl md:text-3xl font-black text-[#e60000] futura">
                        {year}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {editions.length} {isES ? "Ediciones" : "Dossiers"}
                      </span>
                    </div>
                    <svg
                      className={`w-5 h-5 text-[#e60000] transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* --- EDICIONES --- */}
                {isExpanded && (
                  <div className="space-y-4 md:space-y-8 md:ml-20 md:pb-8">
                    {editions.map((edition) => {
                      const dateString = new Date(edition.datePublished)
                        .toLocaleDateString(isES ? "es-ES" : "de-DE", {
                          month: "long",
                          year: "numeric",
                        })
                        .toUpperCase();

                      return (
                        <div key={edition.id} className="relative">
                          {/* --- FECHA (Desktop: izquierda de línea, Mobile: dentro de card) --- */}
                          <div className="hidden md:flex absolute -left-64 lg:-left-80 top-1/2 -translate-y-1/2 w-52 lg:w-64 flex-col items-end pr-4 z-10">
                            <span className="text-xs lg:text-sm font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                              {dateString}
                            </span>
                          </div>

                          {/* Punto de intersección (Solo desktop) - CONECTADO A LÍNEA */}
                          <div className="hidden md:block absolute -left-[2.25rem] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#e60000] rounded-full border-2 border-white shadow-sm" />

                          <Link
                            href={`/${locale}/editions/${edition.id}`}
                            className="block group"
                            onMouseEnter={(e) => {
                              setHoveredEdition(edition.coverImage);
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => {
                              setHoverPosition({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseLeave={() => setHoveredEdition(null)}
                          >
                            {/* --- CARD --- */}
                            <div className="bg-white rounded-xl shadow-sm hover:shadow-xl hover:shadow-red-200/30 border border-gray-100 hover:border-[#e60000]/20 transition-all duration-300 p-4 md:p-5 relative overflow-hidden group-hover:-translate-x-1">
                              {/* Fecha móvil (arriba) */}
                              <div className="md:hidden mb-3 flex items-center gap-2">
                                <div className="h-px flex-1 bg-red-200" />
                                <span className="text-[10px] font-bold text-[#e60000] uppercase tracking-widest px-2">
                                  {dateString}
                                </span>
                                <div className="h-px flex-1 bg-red-200" />
                              </div>

                              <div className="flex items-start gap-4 md:gap-5">
                                {/* Portada */}
                                <div className="flex-shrink-0 w-24 h-36 md:w-28 md:h-40 relative rounded overflow-hidden shadow-md transform group-hover:rotate-1 group-hover:scale-105 transition-all duration-300">
                                  {edition.coverImage ? (
                                    <Image
                                      src={edition.coverImage}
                                      alt={`ila ${edition.number}`}
                                      fill
                                      className="object-cover"
                                      sizes="(max-width: 768px) 64px, 80px"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-red-50 flex items-center justify-center text-[#e60000] font-black text-xs futura">
                                      ila
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xl md:text-2xl font-bold text-[#e60000] futura">
                                      #{edition.number}
                                    </span>
                                  </div>

                                  <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight mb-2 line-clamp-2 group-hover:text-[#e60000] transition-colors">
                                    {isES && edition.titleES
                                      ? edition.titleES
                                      : edition.title}
                                  </h3>
                                  {/* Preview del editorial */}
                                  {(isES
                                    ? edition.summaryES
                                    : edition.summary) && (
                                    <div
                                      className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-3"
                                      dangerouslySetInnerHTML={{
                                        __html: isES
                                          ? edition.summaryES
                                          : edition.summary,
                                      }}
                                    />
                                  )}

                                  {/* Badges de artículos */}
                                  <div className="flex flex-wrap gap-2">
                                    {edition._count?.articles > 0 && (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        {edition._count.articles}{" "}
                                        {isES
                                          ? "Srtículos online"
                                          : "Artikel online"}
                                      </div>
                                    )}

                                    {edition._count?.translatedArticles > 0 && (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-[10px] font-bold text-[#e60000] uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#e60000]"></span>
                                        {edition._count.translatedArticles}{" "}
                                        {isES ? "en español" : "auf Spanisch"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

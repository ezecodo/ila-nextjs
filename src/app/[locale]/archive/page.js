"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import IlaLoader from "../components/IlaLoader/IlaLoader";
import IlaLogo from "../components/IlaLogo/IlaLogo";
import SectionHeader from "../components/SectionsHeader/SetionHeader";

export default function ArchivePage() {
  const locale = useLocale();
  const isES = locale === "es";

  const [editionsByYear, setEditionsByYear] = useState({});
  const [headerHeight, setHeaderHeight] = useState(56);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setHeaderHeight(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  const [registrosByYear, setRegistrosByYear] = useState({});

  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const resEd = await fetch("/api/editions/archive");
        const dataEd = await resEd.json();

        const groupedEd = dataEd.reduce((acc, edition) => {
          const year = new Date(edition.datePublished).getFullYear();
          if (!acc[year]) acc[year] = [];
          acc[year].push(edition);
          return acc;
        }, {});

        Object.keys(groupedEd).forEach((year) => {
          groupedEd[year].sort((a, b) => b.number - a.number);
        });
        setEditionsByYear(groupedEd);

        const resReg = await fetch("/api/annual-index");
        const dataReg = await resReg.json();

        const groupedReg = dataReg.reduce((acc, registro) => {
          const year = registro.year;
          if (!acc[year]) acc[year] = [];
          acc[year].push(registro);
          return acc;
        }, {});
        setRegistrosByYear(groupedReg);
      } catch (error) {
        console.error("Error fetching archive data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleYear = (year) => {
    setExpandedYears((prev) => {
      if (prev[year]) {
        return {};
      }
      return { [year]: true };
    });

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

  const allYearsSet = new Set([
    ...Object.keys(editionsByYear),
    ...Object.keys(registrosByYear),
  ]);
  const years = Array.from(allYearsSet).sort((a, b) => b - a);

  return (
    <>
      <div
        className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 z-40"
        style={{ position: "sticky", top: headerHeight - 1 }}
      >
        <SectionHeader
          title={isES ? "Ediciones / Registro Anual" : "Jahrgänge / Jahresregister"}
          className="mb-0"
        />
      </div>

      <div className="min-h-screen bg-white selection:bg-red-200 relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />

      <main className="relative z-10 max-w-6xl mx-auto pl-4 md:pl-12 pr-6 pt-4 pb-8 md:pb-16">
        <div className="relative ml-8 md:ml-16 pt-0">
          <div className="hidden md:block absolute left-[48px] top-0 bottom-0 w-1 bg-[#BD0E0D]" />

          {years.map((year) => {
            const editions = editionsByYear[year] || [];
            const registros = registrosByYear[year] || [];
            const isExpanded = expandedYears[year];

            return (
              <div key={year} className="mb-8 md:mb-16 relative">
                <div className="flex items-center gap-4 mb-4 md:mb-8 relative z-20">
                  <div
                    className={`hidden md:block absolute left-[48px] w-6 h-6 -ml-[11px] rounded-full shadow-md border-4 border-[#BD0E0D] transition-colors duration-300 ${
                      isExpanded ? "bg-[#BD0E0D]" : "bg-white"
                    }`}
                  />

                  <button
                    id={`year-${year}`}
                    onClick={() => toggleYear(year)}
                    className="w-full md:w-auto md:ml-20 group flex items-center justify-between md:justify-start gap-3 bg-white px-6 py-3 rounded-xl md:rounded-full shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-[#BD0E0D]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl md:text-3xl font-black text-[#BD0E0D] futura">
                        {year}
                      </span>

                      {/* --- AQUÍ ESTÁ EL CAMBIO --- */}
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {editions.length > 0 && (
                          <>
                            {editions.length === 1
                              ? `ila ${editions[0].number}`
                              : `ila ${editions[editions.length - 1].number} – ${editions[0].number}`}
                          </>
                        )}
                        {registros.length > 0 && (
                          <>
                            <span className="mx-1">•</span>
                            {isES ? "Registro anual" : "Jahresregister"} PDF
                          </>
                        )}
                      </span>
                      {/* -------------------------- */}
                    </div>
                    <svg
                      className={`w-5 h-5 text-[#BD0E0D] transition-transform duration-300 ${
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

                {isExpanded && (
                  <div className="space-y-4 md:space-y-8 md:ml-20 md:pb-8">
                    {registros.map((reg) => {
                      const viewUrl = reg.fileUrl;
                      const downloadUrl = reg.fileUrl.replace(
                        "/upload/",
                        `/upload/fl_attachment:ila_register_${reg.year}/`,
                      );

                      return (
                        <div key={`reg-${reg.id}`} className="relative group">
                          <div className="hidden md:block absolute -left-[2.25rem] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#BD0E0D] rounded-full border-2 border-white shadow-sm" />

                          <div className="bg-slate-50 hover:bg-white rounded-lg border border-slate-200 hover:border-[#BD0E0D]/50 shadow-sm hover:shadow-md transition-all duration-300 p-3 flex items-center gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[#BD0E0D]">
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                              </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  {isES ? "Registro Anual" : "Jahresregister"}
                                </span>
                              </div>
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h3 className="font-bold text-gray-900 text-sm md:text-base truncate hover:text-[#BD0E0D] transition-colors">
                                  {isES
                                    ? reg.titleES ||
                                      reg.title ||
                                      `Registro ${reg.year}`
                                    : reg.title || `Register ${reg.year}`}
                                </h3>
                              </a>
                            </div>

                            <a
                              href={downloadUrl}
                              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:border-[#BD0E0D] hover:bg-red-50 text-[#BD0E0D] text-xs font-bold uppercase tracking-wide transition-all shadow-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              <span className="hidden md:inline">
                                {isES ? "Descargar" : "Download"}
                              </span>
                            </a>
                          </div>
                        </div>
                      );
                    })}

                    {editions.map((edition) => {
                      const dateString = new Date(edition.datePublished)
                        .toLocaleDateString(isES ? "es-ES" : "de-DE", {
                          month: "long",
                          year: "numeric",
                        })
                        .toUpperCase();

                      return (
                        <div key={`ed-${edition.id}`} className="relative">
                          <div className="hidden md:flex absolute -left-64 lg:-left-80 top-1/2 -translate-y-1/2 w-52 lg:w-64 flex-col items-end pr-4 z-10">
                            <span className="text-xs lg:text-sm font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                              {dateString}
                            </span>
                          </div>

                          <div className="hidden md:block absolute -left-[2.25rem] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#BD0E0D] rounded-full border-2 border-white shadow-sm" />

                          <Link
                            href={`/${locale}/editions/${edition.id}`}
                            className="block group"
                          >
                            <div className="bg-white rounded-xl shadow-sm hover:shadow-xl hover:shadow-red-200/30 border border-gray-100 hover:border-[#BD0E0D]/20 transition-all duration-300 p-4 md:p-5 relative overflow-hidden group-hover:-translate-x-1">
                              <div className="md:hidden mb-3 flex items-center gap-2">
                                <div className="h-px flex-1 bg-red-200" />
                                <span className="text-[10px] font-bold text-[#BD0E0D] uppercase tracking-widest px-2">
                                  {dateString}
                                </span>
                                <div className="h-px flex-1 bg-red-200" />
                              </div>

                              <div className="flex items-start gap-4 md:gap-5">
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
                                    <div className="w-full h-full bg-red-50 flex items-center justify-center text-[#BD0E0D] font-black text-xs futura">
                                      ila
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xl md:text-2xl font-bold text-[#BD0E0D] futura">
                                      #{edition.number}
                                    </span>
                                  </div>

                                  <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight mb-2 line-clamp-2 group-hover:text-[#BD0E0D] transition-colors">
                                    {isES && edition.titleES
                                      ? edition.titleES
                                      : edition.title}
                                  </h3>

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

                                  <div className="flex flex-wrap gap-2">
                                    {edition._count?.articles > 0 && (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-[10px] font-bold text-green-700 uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        {edition._count.articles}{" "}
                                        {isES
                                          ? "Artículos online"
                                          : "Artikel online"}
                                      </div>
                                    )}

                                    {edition._count?.translatedArticles > 0 && (
                                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-[10px] font-bold text-[#BD0E0D] uppercase tracking-wide">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#BD0E0D]"></span>
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

                    {editions.length === 0 && registros.length === 0 && (
                      <p className="text-sm text-gray-400 pl-4 md:pl-0 italic">
                        No hay contenido disponible para este año.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
    </>
  );
}

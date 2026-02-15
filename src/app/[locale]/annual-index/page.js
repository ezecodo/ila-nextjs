"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import IlaLoader from "../components/IlaLoader/IlaLoader";
import IlaLogo from "../components/IlaLogo/IlaLogo";

export default function AnnualIndexPage() {
  const locale = useLocale();
  const isES = locale === "es";

  const [registrosByYear, setRegistrosByYear] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState({});

  useEffect(() => {
    async function fetchRegistros() {
      try {
        const res = await fetch("/api/annual-index");
        const data = await res.json();
        const grouped = data.reduce((acc, registro) => {
          const year = registro.year;
          if (!acc[year]) acc[year] = [];
          acc[year].push(registro);
          return acc;
        }, {});
        setRegistrosByYear(grouped);
      } catch (error) {
        console.error("Error fetching annual index:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRegistros();
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

  const years = Object.keys(registrosByYear).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-white selection:bg-red-200 relative">
      {/* Patrón de fondo muy sutil */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />

      <main className="relative z-10 max-w-6xl mx-auto pl-4 md:pl-12 pr-6 pt-2 md:pt-4 pb-8 md:pb-16">
        {/* --- CABECERA MINIMALISTA --- */}
        <header className="flex items-center gap-3 mb-0 pb-4 pl-4 md:border-l-4 border-[#BD0E0D] relative ml-8 md:ml-28">
          <IlaLogo size="mini" variant="black-solid" isLink={false} />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isES ? "Registro Anual" : "Jahresregister"}
          </h1>
        </header>

        <div className="relative ml-8 md:ml-16 pt-0">
          {/* Línea vertical roja (Solo desktop) */}
          <div className="hidden md:block absolute left-[48px] top-0 bottom-0 w-1 bg-[#BD0E0D]" />

          {years.map((year) => {
            const registros = registrosByYear[year];
            const isExpanded = expandedYears[year];

            return (
              <div key={year} className="mb-8 md:mb-16 relative">
                {/* --- BOTÓN AÑO --- */}
                <div className="flex items-center gap-4 mb-4 md:mb-8 relative z-20">
                  {/* Círculo en línea */}
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
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {registros.length} {isES ? "Registros" : "Register"}
                      </span>
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

                {/* --- LISTA DE REGISTROS --- */}
                {isExpanded && (
                  <div className="space-y-4 md:space-y-8 md:ml-20 md:pb-8">
                    {registros.map((reg) => {
                      // URL para ver en navegador (Original)
                      const viewUrl = reg.fileUrl;

                      // URL para descargar (Transformada con Cloudinary)
                      const downloadUrl = reg.fileUrl.replace(
                        "/upload/",
                        `/upload/fl_attachment:ila_register_${reg.year}/`,
                      );

                      return (
                        <div key={reg.id} className="relative">
                          {/* Punto de intersección (Solo desktop) */}
                          <div className="hidden md:block absolute -left-[2.25rem] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#BD0E0D] rounded-full border-2 border-white shadow-sm" />

                          {/* CONTENEDOR DE LA CARD (Ahora es un DIV, no un A) */}
                          <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl hover:shadow-red-200/30 border border-gray-100 hover:border-[#BD0E0D]/20 transition-all duration-300 p-4 md:p-5 relative overflow-hidden hover:-translate-x-1">
                            {/* Etiqueta móvil */}
                            <div className="md:hidden mb-3 flex items-center gap-2">
                              <div className="h-px flex-1 bg-red-200" />
                              <span className="text-[10px] font-bold text-[#BD0E0D] uppercase tracking-widest px-2">
                                PDF FILE
                              </span>
                              <div className="h-px flex-1 bg-red-200" />
                            </div>

                            <div className="flex items-start gap-4 md:gap-5">
                              {/* Icono Visual */}
                              <div className="flex-shrink-0 w-24 h-36 md:w-28 md:h-40 relative rounded overflow-hidden shadow-md bg-red-50 flex items-center justify-center transform group-hover:rotate-1 group-hover:scale-105 transition-all duration-300">
                                <svg
                                  className="w-10 h-10 text-[#BD0E0D]"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                </svg>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between h-36 md:h-40 py-1">
                                <div>
                                  {/* ENLACE 1: VER EN NAVEGADOR (Título) */}
                                  <a
                                    href={viewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight mb-2 line-clamp-3 hover:text-[#BD0E0D] transition-colors underline-offset-4 hover:underline">
                                      {isES
                                        ? reg.titleES ||
                                          reg.title ||
                                          `Registro ${reg.year}`
                                        : reg.title || `Register ${reg.year}`}
                                    </h3>
                                  </a>

                                  {/* Fallback si no hay título */}
                                  {!reg.title && !reg.titleES && (
                                    <p className="text-xs text-gray-500 truncate mb-2 font-mono">
                                      {reg.fileUrl.split("/").pop()}
                                    </p>
                                  )}
                                </div>

                                {/* Badges / Info inferior */}
                                <div className="flex flex-wrap items-center gap-2 mt-auto">
                                  {/* ENLACE 2: DESCARGAR (Botón) */}
                                  <a
                                    href={downloadUrl}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-[10px] font-bold text-[#BD0E0D] uppercase tracking-wide border border-red-100 hover:bg-red-100 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
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
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                      />
                                    </svg>
                                    {isES ? "DESCARGAR" : "DOWNLOAD"}
                                  </a>

                                  <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                                    PDF
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
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

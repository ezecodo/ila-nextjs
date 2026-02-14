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
    setExpandedYears((prev) => (prev[year] ? {} : { [year]: true }));
    setTimeout(() => {
      const yearElement = document.getElementById(`year-${year}`);
      if (yearElement) {
        window.scrollTo({
          top:
            yearElement.getBoundingClientRect().top + window.pageYOffset - 150,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <IlaLoader />
      </div>
    );

  const years = Object.keys(registrosByYear).sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-white relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />
      <main className="relative z-10 max-w-6xl mx-auto pl-4 md:pl-12 pr-6 pt-4 pb-16">
        <header className="flex items-center gap-3 mb-4 pb-4 pl-4 md:border-l-4 border-[#BD0E0D] relative ml-8 md:ml-28">
          <IlaLogo size="mini" variant="black-solid" isLink={false} />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isES ? "Registro Anual" : "Jahresregister"}
            </h1>
          </div>
        </header>

        <div className="relative ml-8 md:ml-16">
          <div className="hidden md:block absolute left-[48px] top-0 bottom-0 w-1 bg-[#BD0E0D]" />

          {years.map((year) => {
            const registros = registrosByYear[year];
            const isExpanded = expandedYears[year];

            return (
              <div key={year} className="mb-8 relative">
                <div className="flex items-center gap-4 mb-4 relative z-20">
                  <div
                    className={`hidden md:block absolute left-[48px] w-6 h-6 -ml-[11px] rounded-full border-4 border-[#BD0E0D] ${isExpanded ? "bg-[#BD0E0D]" : "bg-white"}`}
                  />
                  <button
                    id={`year-${year}`}
                    onClick={() => toggleYear(year)}
                    className="w-full md:w-auto md:ml-20 flex items-center gap-3 bg-white px-6 py-3 rounded-xl shadow-sm border-2 border-gray-100 hover:border-[#BD0E0D] transition-all"
                  >
                    <span className="text-2xl font-black text-[#BD0E0D]">
                      {year}
                    </span>
                    <svg
                      className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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
                  <div className="space-y-4 md:ml-20">
                    {registros.map((reg) => {
                      // TRANSFORMACIÓN DE CLOUDINARY
                      const downloadUrl = reg.fileUrl.replace(
                        "/upload/",
                        `/upload/fl_attachment:ila_register_${reg.year}/`,
                      );

                      return (
                        <div
                          key={reg.id}
                          className="bg-white rounded-xl border p-4 flex items-center gap-4 hover:shadow-md transition-all"
                        >
                          <div className="w-16 h-20 bg-red-50 flex items-center justify-center rounded">
                            <svg
                              className="w-8 h-8 text-[#BD0E0D]"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <a
                              href={reg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold hover:text-[#BD0E0D] block mb-2"
                            >
                              {isES
                                ? reg.titleES ||
                                  reg.title ||
                                  `Registro ${reg.year}`
                                : reg.title || `Register ${reg.year}`}
                            </a>
                            <a
                              href={downloadUrl}
                              className="text-sm bg-[#BD0E0D] text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-2 hover:bg-red-700"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              {isES ? "Descargar" : "Download"}
                            </a>
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

"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  FaInstagram,
  FaFacebookF,
  FaTwitter,
  FaYoutube,
  FaGlobe,
  FaNewspaper,
  FaCalendarAlt,
  FaBook,
  FaEnvelope,
  FaExternalLinkAlt,
} from "react-icons/fa";

const iconMap = {
  globe: <FaGlobe size={20} />,
  newspaper: <FaNewspaper size={20} />,
  calendar: <FaCalendarAlt size={20} />,
  book: <FaBook size={20} />,
  envelope: <FaEnvelope size={20} />,
  instagram: <FaInstagram size={20} />,
  facebook: <FaFacebookF size={20} />,
  twitter: <FaTwitter size={20} />,
  youtube: <FaYoutube size={20} />,
};

const categoryLabels = {
  general: { de: "Allgemein", es: "General" },
  articles: { de: "Artikel", es: "Artículos" },
  events: { de: "Veranstaltungen", es: "Eventos" },
  editions: { de: "Ausgaben", es: "Ediciones" },
  social: { de: "Soziale Netzwerke", es: "Redes Sociales" },
};

export default function LinksPage() {
  const locale = useLocale();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/links")
      .then((res) => res.json())
      .then((data) => {
        setLinks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando links:", err);
        setLoading(false);
      });
  }, []);

  const handleClick = async (link) => {
    fetch(`/api/links/click/${link.id}`, { method: "POST" });
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const getTitle = (link) => {
    if (locale === "es" && link.titleES) return link.titleES;
    return link.title;
  };

  const getIcon = (icon) => {
    if (!icon) return <FaExternalLinkAlt size={18} />;
    return iconMap[icon] || <FaExternalLinkAlt size={18} />;
  };

  // Agrupar por categoría
  const groupedLinks = Array.isArray(links)
    ? links.reduce((acc, link) => {
        const cat = link.category || "general";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(link);
        return acc;
      }, {})
    : {};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        {/* Fondo de ruido para el loading */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJnoiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2cpIi8+PC9zdmc+')]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] py-12 px-4 relative overflow-x-hidden">
      {/* FONDO DE RUIDO (GRAIN) */}
      <div className="fixed inset-0 opacity-5 pointer-events-none z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJnoiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2cpIi8+PC9zdmc+')]" />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header con Logo Futura + Rojo */}
        <div className="text-center mb-10 animate-[slideUp_0.6s_ease-out_forwards]">
          <div className="relative mb-6 mx-auto w-fit">
            {/* Logo ila */}
            <div className="w-28 h-28 rounded-sm bg-white flex items-center justify-center shadow-lg">
              <span
                className="text-5xl font-bold text-red-600"
                style={{ fontFamily: "Futura, sans-serif" }}
              >
                ila
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-400 font-light tracking-wide">
            {locale === "es"
              ? "La revista de América Latina"
              : "Das Lateinamerika-Magazin"}
          </p>
        </div>

        {/* Links por categoría */}
        <div className="space-y-6">
          {Object.entries(groupedLinks).map(
            ([category, categoryLinks], index) => (
              <div
                key={category}
                style={{
                  animation: `slideUp 0.6s ease-out forwards ${index * 0.1}s`,
                  opacity: 0,
                }}
              >
                {Object.keys(groupedLinks).length > 1 && (
                  <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                    {locale === "es"
                      ? categoryLabels[category]?.es || category
                      : categoryLabels[category]?.de || category}
                  </h2>
                )}
                <div className="space-y-3">
                  {categoryLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleClick(link)}
                      className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 text-left ${
                        link.isFeatured
                          ? "bg-white text-red-700 shadow-lg hover:shadow-xl hover:scale-[1.02] ring-1 ring-red-500/50"
                          : "bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:scale-[1.01] border border-white/5"
                      }`}
                    >
                      {link.isFeatured && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      )}

                      <div className="relative flex items-center gap-4 px-5 py-4">
                        <span
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            link.isFeatured
                              ? "bg-red-100 text-red-600"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {getIcon(link.icon)}
                        </span>
                        <span className="flex-1 font-medium">
                          {getTitle(link)}
                        </span>
                        <FaExternalLinkAlt
                          size={14}
                          className={`flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${
                            link.isFeatured ? "text-red-400" : "text-white"
                          }`}
                        />
                      </div>

                      {link.isFeatured && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
                          ⭐ {locale === "es" ? "Destacado" : "Empfohlen"}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}
        </div>

        {/* --- ARREGLO AQUÍ: Redes sociales --- */}
        <div className="mt-10 flex justify-center gap-4">
          <a
            href="https://www.instagram.com/ila_bonn/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-600 hover:border-transparent transition-all duration-300"
          >
            <FaInstagram size={20} />
          </a>

          <a
            href="https://www.facebook.com/ila.web"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-600 hover:border-transparent transition-all duration-300"
          >
            <FaFacebookF size={18} />
          </a>
        </div>

        {/* --- ARREGLO AQUÍ: Footer --- */}
        <div className="mt-10 text-center">
          <a
            href={`/${locale}`}
            className="text-gray-500 hover:text-white text-sm transition-colors inline-flex items-center gap-2"
          >
            <span>&larr;</span>
            {locale === "es" ? " Visitar sitio web" : " Zur Webseite"}
          </a>
        </div>

        <div className="mt-8 text-center text-gray-700 text-xs font-mono">
          ila-web.de/links
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

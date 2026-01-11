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
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
        {/* Logo de carga */}
        <div className="w-16 h-16 rounded-sm bg-red-600 flex items-center justify-center shadow-lg animate-pulse">
          <span
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "Futura, sans-serif" }}
          >
            ila
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50/50 py-12 px-4 relative">
      {/* Patrón sutil de fondo */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header con Logo */}
        <div className="text-center mb-12 animate-[slideUp_0.6s_ease-out_forwards]">
          <div className="relative mb-6 mx-auto w-fit">
            {/* Logo ila */}
            <div className="w-20 h-20 rounded-sm bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-200/50">
              <span
                className="text-4xl font-bold text-white"
                style={{ fontFamily: "Futura, sans-serif" }}
              >
                ila
              </span>
            </div>
            {/* Anillo decorativo */}
            <div className="absolute -inset-4 border-2 border-red-200/30 rounded-lg animate-pulse"></div>
          </div>

          <p className="text-sm text-red-800/70 font-medium tracking-wide">
            {locale === "es"
              ? "La revista de América Latina"
              : "Das Lateinamerika-Magazin"}
          </p>
        </div>

        {/* Links por categoría */}
        <div className="space-y-8">
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
                  <h2 className="text-red-700/80 text-xs font-semibold uppercase tracking-wider mb-4 px-3 flex items-center">
                    <span className="h-px flex-1 bg-red-200 mr-3"></span>
                    {locale === "es"
                      ? categoryLabels[category]?.es || category
                      : categoryLabels[category]?.de || category}
                    <span className="h-px flex-1 bg-red-200 ml-3"></span>
                  </h2>
                )}
                <div className="space-y-3">
                  {categoryLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleClick(link)}
                      className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 text-left ${
                        link.isFeatured
                          ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-200/50 hover:shadow-xl hover:scale-[1.02] ring-2 ring-red-500/30"
                          : "bg-white text-gray-800 shadow-md shadow-red-100/30 hover:shadow-lg hover:scale-[1.01] border border-red-100 hover:border-red-200"
                      }`}
                    >
                      {link.isFeatured && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      )}

                      <div className="relative flex items-center gap-4 px-5 py-4">
                        <span
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            link.isFeatured
                              ? "bg-white/20 text-white backdrop-blur-sm"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {getIcon(link.icon)}
                        </span>
                        <span className="flex-1 font-medium text-left">
                          {getTitle(link)}
                        </span>
                        <FaExternalLinkAlt
                          size={14}
                          className={`flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity ${
                            link.isFeatured ? "text-white/80" : "text-red-400"
                          }`}
                        />
                      </div>

                      {link.isFeatured && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl shadow-sm">
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

        {/* Redes sociales */}
        <div className="mt-12 flex justify-center gap-5">
          <a
            href="https://www.instagram.com/ila_bonn/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-200/50 hover:shadow-xl hover:scale-110 hover:from-red-600 hover:to-red-700 transition-all duration-300"
          >
            <FaInstagram size={20} />
          </a>

          <a
            href="https://www.facebook.com/ila.web"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-200/50 hover:shadow-xl hover:scale-110 hover:from-red-600 hover:to-red-700 transition-all duration-300"
          >
            <FaFacebookF size={18} />
          </a>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <a
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-red-700 font-medium text-sm shadow-md shadow-red-100/30 hover:shadow-lg hover:gap-3 hover:bg-red-50 border border-red-100 transition-all duration-300"
          >
            <span>&larr;</span>
            {locale === "es" ? "Visitar sitio web" : "Zur Webseite"}
          </a>
        </div>

        <div className="mt-8 text-center text-red-400/60 text-xs font-medium tracking-wide">
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

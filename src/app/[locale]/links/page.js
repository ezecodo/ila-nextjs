"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  FaInstagram,
  FaFacebookF,
  FaGlobe,
  FaNewspaper,
  FaCalendarAlt,
  FaBook,
  FaEnvelope,
  FaExternalLinkAlt,
  FaStar,
} from "react-icons/fa";

import LatinAmericaBackground from "../components/LatinAmericaBackground/LatinAmericaBackground";
import IlaLogo from "../components/IlaLogo/IlaLogo";

const iconMap = {
  globe: <FaGlobe size={20} />,
  newspaper: <FaNewspaper size={20} />,
  calendar: <FaCalendarAlt size={20} />,
  book: <FaBook size={20} />,
  envelope: <FaEnvelope size={20} />,
  instagram: <FaInstagram size={20} />,
  facebook: <FaFacebookF size={20} />,
};

const categoryLabels = {
  general: { de: "Allgemein", es: "General" },
  articles: { de: "Artikel", es: "Artículos" },
  events: { de: "Veranstaltungen", es: "Eventos" },
  editions: { de: "Ausgaben", es: "Ediciones" },
  social: { de: "Soziale Netzwerke", es: "Redes Sociales" },
};

// --- COMPONENTE 1: Tarjeta Estándar (Artículos, Web, Eventos) ---
// --- COMPONENTE 1: Tarjeta Estándar (Artículos, Web, Eventos) ---
const StandardLinkCard = ({ link, onClick, locale }) => {
  const getTitle = () => {
    if (locale === "es" && link.titleES) return link.titleES;
    return link.title;
  };

  const getIcon = () => {
    if (!link.icon) return <FaExternalLinkAlt size={18} />;
    return iconMap[link.icon] || <FaExternalLinkAlt size={18} />;
  };

  return (
    <button
      onClick={() => onClick(link)}
      className={`group w-full relative overflow-hidden transition-all duration-300 text-left border flex items-stretch shadow-sm hover:shadow-md active:scale-[0.98] rounded-xl ${
        link.isFeatured
          ? "bg-[#e60000] border-[#e60000] text-white"
          : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-100 dark:border-gray-800"
      }`}
    >
      {/* Badge Destacado */}
      {link.isFeatured && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm z-10 flex items-center gap-1">
          <FaStar size={7} />
          TOP
        </div>
      )}

      {/* CONTENEDOR VISUAL (Imagen o Icono) */}
      <div className="w-20 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
        {link.imageUrl ? (
          <img
            src={link.imageUrl}
            alt={getTitle()}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          /* SOLUCIÓN AL ICONO INVISIBLE: Círculo de contraste */
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              link.isFeatured
                ? "bg-white/20 text-white"
                : "bg-red-50 dark:bg-red-900/30 text-[#e60000] group-hover:bg-[#e60000] group-hover:text-white"
            }`}
          >
            {getIcon()}
          </div>
        )}
      </div>

      {/* TEXTO */}
      <div className="flex-1 px-4 py-4 flex flex-col justify-center min-w-0">
        <span
          className={`block font-bold leading-tight text-[15px] mb-1 whitespace-normal uppercase tracking-tight ${
            link.isFeatured ? "text-white" : "text-gray-900 dark:text-white"
          }`}
          style={{ fontFamily: "'Futura', sans-serif" }}
        >
          {getTitle()}
        </span>
        {link.authorName ? (
          <span
            className={`text-[9px] font-black uppercase tracking-widest block ${
              link.isFeatured ? "text-white/70" : "text-red-600"
            }`}
          >
            {link.authorName}
          </span>
        ) : (
          !link.isFeatured && (
            <span className="text-[8px] text-gray-400 uppercase font-bold flex items-center gap-1">
              ila-web.de <FaExternalLinkAlt size={7} />
            </span>
          )
        )}
      </div>

      {/* Flechita final para indicar clic */}
      <div
        className={`flex items-center pr-3 opacity-0 group-hover:opacity-100 transition-all ${
          link.isFeatured ? "text-white" : "text-red-600"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
};

// --- COMPONENTE 2: Tarjeta Especial para Ediciones (Imagen Vertical) ---
const EditionLinkCard = ({ link, onClick, locale }) => {
  const getTitle = () => {
    if (locale === "es" && link.titleES) return link.titleES;
    return link.title;
  };

  return (
    <button
      onClick={() => onClick(link)}
      className="group w-full relative overflow-hidden bg-gradient-to-r from-red-700 to-red-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.99] border border-red-500/30"
    >
      {/* Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <div className="relative p-4 flex items-center gap-4">
        {/* Portada Vertical del Libro/Revista */}
        <div className="relative flex-shrink-0 w-24 h-32 rounded-md overflow-hidden shadow-lg transform -rotate-2 group-hover:rotate-0 transition-transform duration-300">
          {/* Páginas traseras simuladas */}
          <div className="absolute top-0.5 -right-0.5 w-full h-full bg-white/20 rounded-[2px]" />
          <div className="absolute top-1 -right-1 w-full h-full bg-white/10 rounded-[2px]" />

          <img
            src={link.imageUrl}
            alt={getTitle()}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Brillo en portada */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20" />
        </div>

        {/* Información de la Edición */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* Etiqueta de número de edición si existe */}
          {link.editionNumber && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black px-2 py-0.5 bg-white/20 rounded backdrop-blur-sm uppercase">
                #{link.editionNumber}
              </span>
              <span className="text-[9px] font-bold text-red-200 uppercase tracking-wide">
                {locale === "es" ? "Edición Actual" : "Aktuelle Ausgabe"}
              </span>
            </div>
          )}

          <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">
            {getTitle()}
          </h3>

          {link.authorName && (
            <p className="text-sm text-red-100 font-medium line-clamp-1">
              {link.authorName}
            </p>
          )}
        </div>

        {/* Flecha indicadora */}
        <div className="text-red-200 group-hover:text-white group-hover:translate-x-1 transition-all">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
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
    try {
      fetch(`/api/links/click/${link.id}`, { method: "POST" });
    } catch (e) {}
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  // Agrupar links
  const groupedLinks = useMemo(() => {
    if (!Array.isArray(links)) return {};
    return links.reduce((acc, link) => {
      const cat = link.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(link);
      return acc;
    }, {});
  }, [links]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e60000] flex items-center justify-center">
        <div className="animate-pulse">
          <IlaLogo size="default" variant="white-solid" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-red-50 dark:bg-black flex justify-center overflow-x-hidden font-sans selection:bg-red-200">
      {/* Patrón de fondo */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="w-full max-w-md bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm min-h-screen relative flex flex-col shadow-2xl sm:mx-0 border-x sm:border-x-0 border-gray-200/50">
        {/* --- HEADER STICKY --- */}
        <header className="w-full flex items-center bg-[#e60000] text-white relative overflow-hidden h-14 z-50 sticky top-0 flex-shrink-0 shadow-sm">
          <LatinAmericaBackground variant="mobile" className="opacity-30" />
          <div className="relative z-10 w-full h-full flex items-center justify-between px-2">
            <div className="bg-[#e60000] w-16 h-full flex items-center justify-center flex-shrink-0">
              <IlaLogo
                size="default"
                isLink={false}
                variant="white-solid"
                className="transform scale-90 translate-x-1"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
              <span
                className="futura text-[clamp(1rem,5vw,1.3rem)] font-bold text-white whitespace-nowrap leading-none tracking-tight text-center"
                style={{ transform: "translateY(1px) translateX(24px)" }}
              >
                {locale === "es" ? (
                  <>
                    La revista de Am
                    <span
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      e
                      <span
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          left: "0.24em",
                          top: "0.12em",
                          width: "0.17em",
                          height: "0.08em",
                          background: "#fff",
                          borderRadius: "0.03em",
                          transform: "rotate(-35deg)",
                          zIndex: 2,
                        }}
                      />
                    </span>
                    rica Latina
                  </>
                ) : (
                  "Das Lateinamerika-Magazin"
                )}
              </span>
            </div>
            <div className="w-16 h-full flex-shrink-0" />
          </div>
        </header>

        {/* --- CONTENIDO --- */}
        <main className="flex-1 px-4 pt-8 pb-12 overflow-y-auto">
          <div className="space-y-12">
            {Object.entries(groupedLinks).map(([category, categoryLinks]) => (
              <section
                key={category}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <h2 className="flex items-center gap-3 mb-5 px-1">
                  <span className="text-[#e60000] text-[10px] font-black uppercase tracking-[0.3em]">
                    {locale === "es"
                      ? categoryLabels[category]?.es
                      : categoryLabels[category]?.de}
                  </span>
                  <span className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800"></span>
                </h2>

                <div className="space-y-3">
                  {categoryLinks.map((link) =>
                    // Aquí hacemos la discriminación: Si es edición, usa EditionLinkCard, sino StandardLinkCard
                    category === "editions" ? (
                      <EditionLinkCard
                        key={link.id}
                        link={link}
                        onClick={handleClick}
                        locale={locale}
                      />
                    ) : (
                      <StandardLinkCard
                        key={link.id}
                        link={link}
                        onClick={handleClick}
                        locale={locale}
                      />
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </main>

        {/* --- FOOTER --- */}
        <footer className="px-6 pb-10 pt-4 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-900">
          <div className="flex justify-center gap-8 mb-8">
            <a
              href="https://instagram.com/ila_bonn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#e60000] transition-all duration-300 hover:scale-110"
              aria-label="Instagram"
            >
              <FaInstagram size={24} />
            </a>
            <a
              href="https://facebook.com/ila.web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#e60000] transition-all duration-300 hover:scale-110"
              aria-label="Facebook"
            >
              <FaFacebookF size={22} />
            </a>
          </div>

          <a
            href={`/${locale}`}
            className="block w-full py-4 bg-gray-900 text-white font-black futura text-sm tracking-[0.2em] hover:bg-[#e60000] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-center rounded-lg"
          >
            {locale === "es" ? "VOLVER A LA WEB" : "ZUR WEBSEITE"}
          </a>

          <div className="text-center mt-6 text-[10px] text-gray-400 font-sans">
            ila-web.de
          </div>
        </footer>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
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
      <div className="min-h-screen bg-[#e60000] flex items-center justify-center">
        <div className="animate-pulse">
          <IlaLogo size="default" variant="white-solid" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 relative">
      {/* --- HEADER IDENTICO AL MOBILE TOP --- */}
      <div className="w-full flex items-center bg-[#e60000] text-white relative overflow-hidden h-14 z-50">
        <LatinAmericaBackground variant="mobile" />

        <div className="relative z-10 w-full h-full flex items-center justify-between">
          {/* 1. LOGO (Mismo tamaño que el Header) */}
          <div className="bg-[#e60000] w-16 h-full flex items-center justify-center flex-shrink-0">
            <IlaLogo
              size="default"
              isLink={false}
              variant="white-solid"
              className="transform scale-90"
            />
          </div>

          {/* 2. TAGLINE (Mismo tamaño, clamp y desplazamiento) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
            <span
              className="futura text-[clamp(1.1rem,5.5vw,1.6rem)] font-bold text-white whitespace-nowrap leading-none tracking-tight text-center"
              style={{ transform: "translateY(1px) translateX(13px)" }}
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

          {/* 3. ESPACIADOR (Para mantener el equilibrio del flex) */}
          <div className="w-16 h-full flex-shrink-0" />
        </div>
      </div>

      {/* --- CONTENIDO DE LINKS --- */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-10 pb-20">
        <div className="space-y-10">
          {Object.entries(groupedLinks).map(
            ([category, categoryLinks], index) => (
              <div
                key={category}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <h2 className="flex items-center gap-3 mb-5 px-1">
                  <span className="text-[#e60000] text-xs font-black uppercase tracking-[0.3em]">
                    {locale === "es"
                      ? categoryLabels[category]?.es
                      : categoryLabels[category]?.de}
                  </span>
                  <span className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800"></span>
                </h2>

                <div className="space-y-3">
                  {categoryLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleClick(link)}
                      className={`w-full group relative transition-all duration-200 text-left border flex items-center shadow-sm ${
                        link.isFeatured
                          ? "bg-[#e60000] border-[#e60000] text-white"
                          : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      <div
                        className={`w-14 h-14 flex-shrink-0 flex items-center justify-center border-r ${
                          link.isFeatured
                            ? "border-white/10"
                            : "border-gray-100 dark:border-gray-800 text-[#e60000]"
                        }`}
                      >
                        {link.imageUrl ? (
                          <img
                            src={link.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getIcon(link.icon)
                        )}
                      </div>

                      <div className="flex-1 px-4 py-3 min-w-0">
                        <span className="font-bold futura text-base uppercase leading-tight block truncate">
                          {getTitle(link)}
                        </span>
                        {link.authorName && (
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest mt-0.5 block ${
                              link.isFeatured
                                ? "text-white/70"
                                : "text-gray-400"
                            }`}
                          >
                            {link.authorName}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-16 text-center">
          <div className="flex justify-center gap-8 mb-10">
            <a
              href="https://instagram.com/ila_bonn"
              target="_blank"
              className="text-gray-400 hover:text-[#e60000] transition-colors"
            >
              <FaInstagram size={24} />
            </a>
            <a
              href="https://facebook.com/ila.web"
              target="_blank"
              className="text-gray-400 hover:text-[#e60000] transition-colors"
            >
              <FaFacebookF size={22} />
            </a>
          </div>

          <a
            href={`/${locale}`}
            className="inline-block w-full py-4 bg-black text-white font-black futura text-sm tracking-[0.2em] hover:bg-[#e60000] transition-all"
          >
            {locale === "es" ? "VOLVER A LA WEB" : "ZUR WEBSEITE"}
          </a>
        </div>
      </div>
    </div>
  );
}

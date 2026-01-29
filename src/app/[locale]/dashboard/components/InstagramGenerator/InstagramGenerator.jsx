"use client";

import React, { useState, useRef } from "react";
import { toPng } from "html-to-image";
import IlaLogo50 from "../../../components/IlaLogo/ilaLogo50";
import ArticleSelector from "../ArticleSelector/ArticleSelector";
import {
  FaNewspaper,
  FaSearch,
  FaTimes,
  FaExternalLinkAlt,
  FaImages,
  FaDownload,
  FaPlus,
  FaMinus,
  FaCheck,
} from "react-icons/fa";

// Formatos de Instagram
const FORMATS = {
  story: { name: "Historia", width: 1080, height: 1920, ratio: "9:16" },
  square: { name: "Post Cuadrado", width: 1080, height: 1080, ratio: "1:1" },
  portrait: { name: "Post Vertical", width: 1080, height: 1350, ratio: "4:5" },
};

// Plantillas disponibles para post individual
const TEMPLATES = {
  classic: {
    name: "Clásica",
    description: "Logo arriba, imagen, título abajo",
  },
  bold: {
    name: "Impacto",
    description: "Título grande sobre imagen oscurecida",
  },
  minimal: { name: "Minimal", description: "Fondo rojo, solo texto y logo" },
  magazine: {
    name: "Revista",
    description: "Estilo editorial con número de edición",
  },
};

// Opciones de tamaño del logo
const LOGO_SIZE_OPTIONS = [
  { name: "Mini", value: "mini" },
  { name: "Grande", value: "default" },
  { name: "Extra Grande", value: "large" },
];

// Meses en alemán
const MESES_ALEMAN = {
  "01": "Januar",
  "02": "Februar",
  "03": "März",
  "04": "April",
  "05": "Mai",
  "06": "Juni",
  "07": "Juli",
  "08": "August",
  "09": "September",
  10: "Oktober",
  11: "November",
  12: "Dezember",
};

// Caracteres máximos por slide de contenido
const MAX_CHARS_PER_SLIDE = 350;

export default function InstagramGenerator({ initialArticle }) {
  // === ESTADOS GENERALES ===
  const [mode, setMode] = useState("single"); // "single" o "carousel"
  const [format, setFormat] = useState("portrait");
  const [template, setTemplate] = useState("classic");
  const [customTitle, setCustomTitle] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(
    initialArticle || null,
  );
  const [logoSize, setLogoSize] = useState("default");

  // === ESTADOS PARA CARRUSEL ===
  const [carouselText, setCarouselText] = useState("");
  const [currentSlidePreview, setCurrentSlidePreview] = useState(0);

  // === REFS ===
  const previewRef = useRef(null);
  const carouselSlideRefs = useRef([]);

  // === DATOS DEL ARTÍCULO ===
  const title =
    customTitle ||
    selectedArticle?.title ||
    initialArticle?.title ||
    "Título del artículo";
  const subtitle = selectedArticle?.subtitle || initialArticle?.subtitle || "";
  const author =
    selectedArticle?.authors?.[0]?.name ||
    initialArticle?.authors?.[0]?.name ||
    "Autor";
  const imageUrl =
    selectedArticle?.images?.[0]?.url ||
    initialArticle?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800";
  const imageCredit =
    selectedArticle?.images?.[0]?.alt || initialArticle?.images?.[0]?.alt || "";
  const editionNumber =
    selectedArticle?.edition?.number ||
    initialArticle?.edition?.number ||
    "491";
  const editionTitle =
    selectedArticle?.edition?.title || initialArticle?.edition?.title || "";
  const publicationDate =
    selectedArticle?.publicationDate ||
    initialArticle?.publicationDate ||
    "2025-01";

  // Extraer mes de la fecha
  const getMesAleman = () => {
    const mes = publicationDate?.slice(5, 7) || "01";
    return MESES_ALEMAN[mes] || "November";
  };

  const currentFormat = FORMATS[format];
  const scale = format === "story" ? 0.35 : 0.4;

  // === FUNCIONES PARA CARRUSEL ===

  // Dividir texto en slides
  const splitTextIntoSlides = (text) => {
    if (!text.trim()) return [];

    const words = text.trim().split(/\s+/);
    const slides = [];
    let currentSlide = "";

    for (const word of words) {
      const testSlide = currentSlide ? `${currentSlide} ${word}` : word;

      if (testSlide.length > MAX_CHARS_PER_SLIDE && currentSlide) {
        slides.push(currentSlide.trim());
        currentSlide = word;
      } else {
        currentSlide = testSlide;
      }
    }

    if (currentSlide.trim()) {
      slides.push(currentSlide.trim());
    }

    return slides;
  };

  // Generar slides del carrusel
  const generateCarouselSlides = () => {
    const contentSlides = splitTextIntoSlides(carouselText);

    // Slide 1: Portada
    const slides = [
      {
        type: "cover",
        title,
        subtitle,
        author,
        imageUrl,
        imageCredit,
      },
    ];

    // Slides de contenido
    contentSlides.forEach((text, index) => {
      slides.push({
        type: "content",
        text,
        slideNumber: index + 2,
      });
    });

    // Slide final: CTA
    slides.push({
      type: "cta",
      editionNumber,
      mes: getMesAleman(),
    });

    return slides;
  };

  const carouselSlides = generateCarouselSlides();
  const carouselFormat = "portrait";

  // === HANDLERS ===

  const handleArticlesSelected = (articles) => {
    if (articles.length > 0) {
      const article = articles[0];
      setSelectedArticle(article);
      setCustomTitle("");
      setShowArticleSelector(false);
    }
  };

  const clearSelectedArticle = () => {
    setSelectedArticle(null);
    setCustomTitle("");
    setCarouselText("");
  };

  // === FUNCIÓN DE DESCARGA INDIVIDUAL ===
  const downloadImage = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);

    const scaleFactor = 1 / scale;
    const previewWidth = currentFormat.width * scale;
    const previewHeight = currentFormat.height * scale;

    try {
      const dataUrl = await toPng(previewRef.current, {
        width: previewWidth,
        height: previewHeight,
        pixelRatio: scaleFactor,
        cacheBust: true,
        includeQueryParams: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
          padding: "0",
        },
      });

      const link = document.createElement("a");
      link.download = `ila-instagram-${format}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Error de exportación. Revisa la consola para más detalles.");
    } finally {
      setIsExporting(false);
    }
  };

  // === FUNCIÓN DE DESCARGA DE CARRUSEL ===
  const downloadCarouselSlide = async (slideIndex) => {
    const slideRef = carouselSlideRefs.current[slideIndex];
    if (!slideRef) return;

    const scaleFactor = 1 / scale;
    const previewWidth = FORMATS.portrait.width * scale;
    const previewHeight = FORMATS.portrait.height * scale;

    try {
      const dataUrl = await toPng(slideRef, {
        width: previewWidth,
        height: previewHeight,
        pixelRatio: scaleFactor,
        cacheBust: true,
        includeQueryParams: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
          margin: "0",
          padding: "0",
        },
      });

      const link = document.createElement("a");
      link.download = `ila-carousel-slide-${slideIndex + 1}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error al exportar slide:", error);
    }
  };

  const downloadAllCarouselSlides = async () => {
    setIsExporting(true);

    for (let i = 0; i < carouselSlides.length; i++) {
      await downloadCarouselSlide(i);
      // Pequeña pausa entre descargas
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsExporting(false);
  };

  // === FUNCIONES DE ESTILO ===

  const getContainerClasses = () => {
    const base = "relative overflow-hidden";
    if (template === "minimal") return `${base} bg-[#BD0E0D]`;
    return `${base} bg-zinc-900`;
  };

  const getLogoPosition = () => {
    if (template === "magazine") return "absolute top-6 left-6"; // ← Cambiado de top-4 left-4
    if (template === "bold") return "absolute top-8 left-1/2 -translate-x-1/2"; // ← Cambiado de top-6
    return "absolute top-6 left-1/2 -translate-x-1/2"; // ← Cambiado de top-4
  };

  // FUNCIÓN 1: getTitleContainerClasses - PERFECCIONADA
  const getTitleContainerClasses = () => {
    if (template === "bold") {
      return "absolute inset-0 flex flex-col items-center justify-center p-6 text-center";
    }
    if (template === "minimal") {
      return "absolute inset-0 flex flex-col items-center justify-center p-8 text-center";
    }

    // PARA PLANTILLA CLÁSICA (y magazine) - 3 SUBVARIANTES
    if (template === "classic" || template === "magazine") {
      if (format === "square") {
        return "absolute bottom-0 left-0 right-0 p-8 pb-12"; // Cuadrado: más padding abajo
      }
      if (format === "story") {
        return "absolute bottom-0 left-0 right-0 p-8 pb-16"; // Historia: mucho padding
      }
      return "absolute bottom-0 left-0 right-0 p-8 pb-10"; // Vertical: padding normal
    }

    return "absolute bottom-0 left-0 right-0 p-6";
  };
  // FUNCIÓN 2: getTitleSize - PERFECCIONADA
  // FUNCIÓN 2: getTitleSize - ACTUALIZADA
  const getTitleSize = () => {
    if (template === "bold")
      return format === "story" ? "text-5xl" : "text-4xl"; // Aumentado
    if (template === "minimal")
      return format === "story" ? "text-4xl" : "text-3xl"; // Aumentado

    // PARA PLANTILLA CLÁSICA - 3 SUBVARIANTES
    if (template === "classic" || template === "magazine") {
      if (format === "square") return "text-4xl"; // Cuadrado: aumentado
      if (format === "story") return "text-4xl"; // Historia: aumentado
      return "text-3xl"; // Vertical: ¡AUMENTADO de text-2xl a text-3xl!
    }

    return format === "story" ? "text-3xl" : "text-2xl"; // Aumentado
  };

  // === COMPONENTE SLIDE PORTADA ===
  // === COMPONENTE SLIDE PORTADA ===
  const CoverSlide = React.forwardRef(
    ({ slide, scale: s, format: fmt = "portrait" }, ref) => {
      // <-- Añadir format
      // Valores según formato
      const getValuesByFormat = () => {
        switch (fmt) {
          case "story": // 9:16 (historias)
            return {
              imageHeight: "65%", // Más imagen
              gradientHeight: "45%", // Menos gradiente
              titleSize: 36, // Tamaño diferente
              paddingBottom: "8", // Menos padding
              showNumber: false, // No mostrar número en stories
            };
          case "square": // 1:1 (cuadrado)
            return {
              imageHeight: "50%", // ← MENOS imagen (de 60% a 50%)
              gradientHeight: "60%", // ← MÁS gradiente (de 50% a 60%)
              titleSize: 36, // ← Título MÁS GRANDE (de 32 a 36)
              paddingBottom: "20", // ← MÁS padding (de 12 a 20)
              showNumber: true,
            };
          case "portrait": // 4:5 (vertical)
          default:
            return {
              imageHeight: "55%",
              gradientHeight: "60%",
              titleSize: 42, // El más grande para portrait
              paddingBottom: "16",
              showNumber: true,
            };
        }
      };

      const values = getValuesByFormat();

      return (
        <div
          ref={ref}
          className="relative overflow-hidden bg-zinc-900"
          style={{
            width: FORMATS[fmt].width * s,
            height: FORMATS[fmt].height * s,
          }}
        >
          {/* Imagen - RESPONSIVE */}
          <img
            src={slide.imageUrl}
            crossOrigin="anonymous"
            alt=""
            className="absolute inset-0 object-cover w-full"
            style={{ height: values.imageHeight }}
          />

          {/* Gradient ROJO - RESPONSIVE */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{
              height: values.gradientHeight,
              background:
                "linear-gradient(to top, #8B0000 20%, rgba(185,28,28,0.9) 40%, transparent 100%)",
            }}
          />

          {/* Logo - POSICIÓN RESPONSIVE */}
          <div
            className={`absolute ${fmt === "story" ? "top-6" : "top-4"} left-4`}
          >
            <IlaLogo50
              key={`cover-logo-${logoSize}-${fmt}`}
              size={fmt === "story" ? "default" : logoSize}
              isLink={false}
              animated={false}
              show50={true}
            />
          </div>

          {/* Número 50 (solo para algunos formatos) */}
          {values.showNumber && (
            <div
              className={`absolute ${fmt === "story" ? "top-20" : "top-10"} left-1/2 -translate-x-1/2`}
            >
              <span
                className="text-white font-bold"
                style={{
                  fontSize: `${fmt === "story" ? 60 : 80} * s * 2.5}px`,
                  opacity: 0.9,
                }}
              >
                50
              </span>
            </div>
          )}

          {/* Crédito de imagen - POSICIÓN RESPONSIVE */}
          {slide.imageCredit && (
            <div
              className="absolute right-4 text-white/80 text-right"
              style={{
                top: `calc(${values.imageHeight} - 10%)`,
                fontSize: `${8 * s * 2.5}px`,
              }}
            >
              Foto: {slide.imageCredit}
            </div>
          )}

          {/* Contenido - TAMAÑO Y POSICIÓN RESPONSIVE */}
          <div
            className={`absolute ${fmt === "story" ? "bottom-12" : "bottom-16"} left-0 right-0 p-6 text-white ${fmt === "story" ? "text-center" : ""}`}
          >
            <h2
              className="font-bold leading-tight preview-title mb-3"
              style={{
                fontSize: `${values.titleSize * s * 2.5}px`,
                lineHeight: 1.05,
              }}
            >
              {slide.title}
            </h2>

            {slide.subtitle && (
              <p
                className={`mt-3 opacity-90 italic ${fmt === "story" ? "text-center" : ""}`}
                style={{
                  fontSize: `${values.titleSize * 0.6 * s * 2.5}px`,
                  lineHeight: 1.15,
                }}
              >
                {slide.subtitle}
              </p>
            )}

            <p
              className={`mt-6 opacity-80 ${fmt === "story" ? "text-center" : ""}`}
              style={{
                fontSize: `${values.titleSize * 0.45 * s * 2.5}px`,
              }}
            >
              von {slide.author}
            </p>
          </div>

          {/* Barra inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#8B0000]" />
        </div>
      );
    },
  );
  CoverSlide.displayName = "CoverSlide";

  // === COMPONENTE SLIDE CONTENIDO ===
  const ContentSlide = React.forwardRef(({ slide, scale: s }, ref) => (
    <div
      ref={ref}
      className="relative overflow-hidden bg-[#B91C1C]"
      style={{
        width: FORMATS.portrait.width * s,
        height: FORMATS.portrait.height * s,
      }}
    >
      {/* Logo */}
      <div className="absolute top-4 left-4 flex items-center">
        <IlaLogo50
          key={`content-logo-${logoSize}`}
          size="mini"
          isLink={false}
          animated={false}
          show50={false}
        />
        {/* Línea decorativa */}
        <div
          className="bg-white ml-2"
          style={{
            width: `${80 * s * 2.5}px`,
            height: `${4 * s * 2.5}px`,
          }}
        />
      </div>

      {/* Marco blanco */}
      <div
        className="absolute border-white"
        style={{
          top: `${100 * s * 2.5}px`,
          left: `${40 * s * 2.5}px`,
          right: `${40 * s * 2.5}px`,
          bottom: `${60 * s * 2.5}px`,
          borderWidth: `${3 * s * 2.5}px`,
        }}
      >
        {/* Texto centrado */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <p
            className="text-white text-center leading-relaxed"
            style={{
              fontSize: `${18 * s * 2.5}px`,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {slide.text}
          </p>
        </div>
      </div>
    </div>
  ));
  ContentSlide.displayName = "ContentSlide";

  // === COMPONENTE SLIDE CTA ===
  const CTASlide = React.forwardRef(({ slide, scale: s }, ref) => (
    <div
      ref={ref}
      className="relative overflow-hidden bg-[#B91C1C]"
      style={{
        width: FORMATS.portrait.width * s,
        height: FORMATS.portrait.height * s,
      }}
    >
      {/* Logo */}
      <div className="absolute top-4 left-4 flex items-center">
        <IlaLogo50
          key={`cta-logo-${logoSize}`}
          size="mini"
          isLink={false}
          animated={false}
          show50={false}
        />
        {/* Línea decorativa */}
        <div
          className="bg-white ml-2"
          style={{
            width: `${80 * s * 2.5}px`,
            height: `${4 * s * 2.5}px`,
          }}
        />
      </div>

      {/* Marco blanco */}
      <div
        className="absolute border-white"
        style={{
          top: `${100 * s * 2.5}px`,
          left: `${40 * s * 2.5}px`,
          right: `${40 * s * 2.5}px`,
          bottom: `${60 * s * 2.5}px`,
          borderWidth: `${3 * s * 2.5}px`,
        }}
      >
        {/* Texto CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white text-center">
          <p
            className="leading-relaxed"
            style={{ fontSize: `${16 * s * 2.5}px` }}
          >
            Den ganzen Artikel findest du auf unserer Website und in unserer{" "}
            {slide.mes}ausgabe {slide.editionNumber}.
          </p>

          <p
            className="mt-6 leading-relaxed"
            style={{ fontSize: `${16 * s * 2.5}px` }}
          >
            Wenn dich Posts wie dieser interessieren und du unabhängigen,
            kritischen und solidarischen Journalismus unterstützen möchtest,
          </p>

          <p
            className="mt-6 font-bold leading-relaxed"
            style={{ fontSize: `${18 * s * 2.5}px` }}
          >
            abonniere uns oder spende ein bisschen an unsere Zeitschrift:
          </p>

          <p
            className="mt-6 font-bold"
            style={{ fontSize: `${22 * s * 2.5}px` }}
          >
            www.ila-web.de
          </p>
        </div>
      </div>
    </div>
  ));
  CTASlide.displayName = "CTASlide";

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  
  .generator-container { font-family: 'DM Sans', sans-serif; }
  .preview-title { 
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    letter-spacing: -0.3px;
    line-height: 1.05;
  }
  
  /* Clase para títulos en mayúsculas (estilo ILA) */
  .preview-title.uppercase-style {
    text-transform: uppercase;
    letter-spacing: 0.5px; /* Más espacio para mayúsculas */
    font-weight: 900; /* Extra bold para mayúsculas */
  }
  
  /* Fondo de patrón de puntos */
  .bg-pattern {
    background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px);
    background-size: 24px 24px;
  }
  
  /* Botones modernos */
  .control-card {
    background: rgba(24, 24, 27, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .control-card:hover {
    border-color: rgba(185, 28, 28, 0.4);
    background: rgba(24, 24, 27, 0.9);
    transform: translateY(-2px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  }
  
  .control-card.active {
    border-color: #B91C1C;
    background: rgba(185, 28, 28, 0.1);
    box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.2), 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  }
  
  .mode-btn {
    transition: all 0.3s ease;
  }
  .mode-btn.active {
    background-color: #B91C1C;
    color: white;
    box-shadow: 0 4px 12px rgba(185, 28, 28, 0.4);
  }
  
  /* Área de preview */
  .preview-stage {
    background: radial-gradient(circle at center, #27272a 0%, #18181b 100%);
    box-shadow: inset 0 0 40px rgba(0,0,0,0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  /* Scrollbar personalizada */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #18181b; }
  ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #52525b; }
  
  .input-dark {
    background: #18181b;
    border: 1px solid #27272a;
    transition: all 0.2s;
  }
  .input-dark:focus {
    border-color: #B91C1C;
    outline: none;
    box-shadow: 0 0 0 2px rgba(185, 28, 28, 0.2);
  }
`}</style>

      <div className="generator-container max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-5 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-zinc-900 p-2 rounded-lg border border-white/5">
              <IlaLogo50
                size="mini"
                isLink={false}
                animated={false}
                show50={true}
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
            Generador de Instagram
          </h1>
          <p className="text-zinc-400 text-lg font-light">
            Crea contenido visual profesional en segundos
          </p>
        </div>

        {/* Selector de modo (Segmented Control) */}
        <div className="flex justify-center mb-12">
          <div className="bg-zinc-900 p-1.5 rounded-xl inline-flex gap-1 border border-white/10 shadow-xl">
            <button
              onClick={() => setMode("single")}
              className={`mode-btn px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm ${
                mode === "single"
                  ? "active"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FaNewspaper />
              <span>Post Individual</span>
            </button>
            <button
              onClick={() => setMode("carousel")}
              className={`mode-btn px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium text-sm ${
                mode === "carousel"
                  ? "active"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FaImages />
              <span>Carrusel</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Panel de controles (Izquierda) */}
          <div className="lg:col-span-5 space-y-8">
            {/* === MODO POST INDIVIDUAL === */}
            {mode === "single" && (
              <div className="space-y-6">
                {/* Selector de formato */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Formato
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(FORMATS).map(([key, f]) => (
                      <button
                        key={key}
                        onClick={() => setFormat(key)}
                        className={`control-card p-4 rounded-xl text-center ${format === key ? "active" : ""}`}
                      >
                        <div className="text-sm font-semibold text-white mb-1">
                          {f.name}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          {f.ratio}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selector de plantilla */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Plantilla
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(TEMPLATES).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setTemplate(key)}
                        className={`control-card p-4 rounded-xl text-left ${template === key ? "active" : ""}`}
                      >
                        <div className="font-semibold text-sm text-white mb-1">
                          {t.name}
                        </div>
                        <div className="text-xs text-zinc-400 leading-tight">
                          {t.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* === CONTENIDO (AMBOS MODOS) === */}
            <div className="space-y-6">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Contenido
              </label>

              <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 space-y-5">
                {/* Selector de artículo */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Fuente del artículo
                  </label>
                  {selectedArticle ? (
                    <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-4 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                      <div className="flex items-start justify-between pl-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <FaCheck className="text-green-500 text-xs" />
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wide">
                              Artículo Seleccionado
                            </span>
                          </div>
                          <h4 className="text-white font-medium text-sm truncate leading-tight mb-1">
                            {selectedArticle.title}
                          </h4>
                          {selectedArticle.authors?.[0]?.name && (
                            <p className="text-xs text-zinc-400">
                              por {selectedArticle.authors[0].name}
                            </p>
                          )}
                          {selectedArticle.edition && (
                            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-zinc-700 rounded text-zinc-300 border border-zinc-600">
                              Edición #{selectedArticle.edition.number}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={clearSelectedArticle}
                          className="ml-3 p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-700/50 rounded-lg transition-colors"
                          title="Quitar artículo"
                        >
                          <FaTimes size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowArticleSelector(true)}
                      className="w-full py-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-red-500/50 hover:bg-zinc-800/50 transition-all flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-zinc-200 group"
                    >
                      <div className="p-3 bg-zinc-800 rounded-full group-hover:scale-110 transition-transform">
                        <FaSearch className="text-red-500" />
                      </div>
                      <span className="text-sm font-medium">
                        Buscar en la base de datos
                      </span>
                    </button>
                  )}
                </div>

                {/* Título personalizado (solo en modo single) */}
                {mode === "single" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Título personalizado
                    </label>
                    <textarea
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={title}
                      className="input-dark w-full p-3 rounded-xl text-sm text-white resize-none"
                      rows={2}
                    />
                  </div>
                )}

                {/* Texto del carrusel (solo en modo carousel) */}
                {mode === "carousel" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2 flex justify-between">
                      <span>Texto del Carrusel</span>
                      <span className="text-xs text-zinc-500 font-normal">
                        {carouselText.length} chars /{" "}
                        {splitTextIntoSlides(carouselText).length} slides
                      </span>
                    </label>
                    <textarea
                      value={carouselText}
                      onChange={(e) => setCarouselText(e.target.value)}
                      placeholder="Escribe o pega el contenido que quieres dividir en slides..."
                      className="input-dark w-full p-3 rounded-xl text-sm text-white resize-none h-32"
                    />
                  </div>
                )}

                {/* Tamaño del logo */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Tamaño del logo
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {LOGO_SIZE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLogoSize(option.value)}
                        className={`py-3 rounded-xl text-sm font-medium transition-all border ${
                          logoSize === option.value
                            ? "bg-red-600/20 border-red-600 text-red-400"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de descarga */}
            {mode === "single" ? (
              <button
                onClick={downloadImage}
                disabled={isExporting}
                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/20 hover:shadow-red-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <FaDownload />
                    Descargar PNG
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => downloadCarouselSlide(currentSlidePreview)}
                  disabled={isExporting}
                  className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-900/20 transition-all active:scale-[0.98]"
                >
                  <FaDownload />
                  Descargar Slide Actual
                </button>
                <button
                  onClick={downloadAllCarouselSlides}
                  disabled={isExporting || carouselSlides.length < 2}
                  className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-zinc-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <FaImages />
                      Descargar Todo ({carouselSlides.length} slides)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Preview (Derecha) */}
          <div className="lg:col-span-7 flex flex-col items-center sticky top-8">
            <div className="w-full flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Vista Previa
              </h2>
              <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                {mode === "single"
                  ? `${currentFormat.width} × ${currentFormat.height} px`
                  : `${FORMATS.portrait.width} × ${FORMATS.portrait.height} px`}
              </div>
            </div>

            <div className="preview-stage w-full rounded-3xl p-6 md:p-10 flex items-center justify-center min-h-[600px] relative overflow-hidden">
              {/* === PREVIEW POST INDIVIDUAL === */}
              {/* === PREVIEW POST INDIVIDUAL === */}
              {/* === PREVIEW POST INDIVIDUAL === */}
              {mode === "single" && (
                <div className="relative transition-transform duration-500 hover:scale-[1.02]">
                  <div
                    ref={previewRef}
                    className={getContainerClasses()}
                    style={{
                      width: currentFormat.width * scale,
                      height: currentFormat.height * scale,
                    }}
                  >
                    {template !== "minimal" && imageUrl && (
                      <>
                        {/* Fondo rojo primero */}
                        <div className="absolute inset-0 bg-[#BD0E0D]" />

                        {/* Imagen con margen interno (como paspartú) */}
                        <div
                          className="absolute inset-0"
                          style={{
                            margin: format === "story" ? "12px" : "8px", // Grosor del marco
                          }}
                        >
                          <img
                            src={imageUrl}
                            crossOrigin="anonymous"
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* GRADIENTE (más transparente ya que hay marco rojo) */}
                        {(template === "classic" ||
                          template === "magazine") && (
                          <div
                            className="absolute bottom-0 left-0 right-0"
                            style={{
                              height: "50%",
                              background: `
  linear-gradient(
    to top,
    rgba(110, 0, 0, 1) 0%,
    rgba(130, 0, 0, 0.95) 30%,
    rgba(150, 10, 10, 0.7) 60%,
    transparent 100%
  )
`,
                            }}
                          />
                        )}
                      </>
                    )}

                    <div className={getLogoPosition()}>
                      <IlaLogo50
                        key={`logo-${logoSize}-${format}`}
                        size={logoSize}
                        isLink={false}
                        animated={false}
                        show50={true}
                      />
                    </div>

                    {template === "magazine" && (
                      <div
                        className="absolute top-4 right-4 bg-red-700 px-3 py-1.5 rounded shadow-lg"
                        style={{
                          fontSize: format === "story" ? "14px" : "12px",
                        }}
                      >
                        <span className="text-white font-bold">
                          {editionNumber}/{publicationDate?.slice(0, 4)}
                        </span>
                      </div>
                    )}

                    {/* CONTENEDOR DE TEXTO ENCIMA DEL GRADIENTE */}
                    <div className={`${getTitleContainerClasses()} z-10`}>
                      {template === "minimal" && <div className="flex-1" />}

                      {/* TEXTO CON FONDO SEMITRANSPARENTE SI ES NECESARIO */}
                      <div className="relative">
                        <h3
                          className={`preview-title text-white font-bold leading-tight ${getTitleSize()}`}
                          style={{
                            maxWidth: "95%",
                            textShadow: "0 2px 10px rgba(0,0,0,0.7)",
                          }}
                        >
                          {title}
                        </h3>

                        {subtitle && template !== "minimal" && (
                          <p
                            className="text-white/90 mt-2 italic"
                            style={{
                              fontSize:
                                template === "classic" ||
                                template === "magazine"
                                  ? format === "square"
                                    ? "18px"
                                    : format === "story"
                                      ? "16px"
                                      : "14px"
                                  : format === "story"
                                    ? "16px"
                                    : "14px",
                            }}
                          >
                            {subtitle}
                          </p>
                        )}

                        {template !== "minimal" && (
                          <p
                            className="text-white/80 mt-2"
                            style={{
                              fontSize:
                                template === "classic" ||
                                template === "magazine"
                                  ? format === "square"
                                    ? "15px"
                                    : format === "story"
                                      ? "14px"
                                      : "12px"
                                  : format === "story"
                                    ? "14px"
                                    : "12px",
                            }}
                          >
                            von {author}
                          </p>
                        )}
                      </div>

                      {template === "minimal" && <div className="flex-1" />}
                    </div>
                  </div>
                </div>
              )}

              {/* === PREVIEW CARRUSEL === */}
              {mode === "carousel" && (
                <div className="w-full max-w-sm">
                  {/* Controles de navegación del preview */}
                  <div className="flex items-center justify-between mb-6 bg-zinc-900/80 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-xl">
                    <button
                      onClick={() =>
                        setCurrentSlidePreview(
                          Math.max(0, currentSlidePreview - 1),
                        )
                      }
                      disabled={currentSlidePreview === 0}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FaMinus size={12} />
                    </button>
                    <span className="text-xs font-mono font-semibold text-zinc-300">
                      {currentSlidePreview + 1}{" "}
                      <span className="text-zinc-600">/</span>{" "}
                      {carouselSlides.length}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentSlidePreview(
                          Math.min(
                            carouselSlides.length - 1,
                            currentSlidePreview + 1,
                          ),
                        )
                      }
                      disabled={
                        currentSlidePreview === carouselSlides.length - 1
                      }
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>

                  {/* Contenedor del slide */}
                  <div className="relative flex items-center justify-center min-h-[300px]">
                    {carouselSlides.map((slide, index) => (
                      <div
                        key={index}
                        style={{
                          display:
                            index === currentSlidePreview ? "block" : "none",
                        }}
                      >
                        {slide.type === "cover" && (
                          <CoverSlide
                            ref={(el) =>
                              (carouselSlideRefs.current[index] = el)
                            }
                            slide={slide}
                            scale={scale}
                            format={mode === "carousel" ? "portrait" : format} // <-- Usa portrait para carrusel, el seleccionado para single
                          />
                        )}
                        {slide.type === "content" && (
                          <ContentSlide
                            ref={(el) =>
                              (carouselSlideRefs.current[index] = el)
                            }
                            slide={slide}
                            scale={scale}
                          />
                        )}
                        {slide.type === "cta" && (
                          <CTASlide
                            ref={(el) =>
                              (carouselSlideRefs.current[index] = el)
                            }
                            slide={slide}
                            scale={scale}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dots */}
                  <div className="flex justify-center gap-2 mt-6">
                    {carouselSlides.map((slide, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlidePreview(index)}
                        className={`transition-all duration-300 ${
                          index === currentSlidePreview
                            ? "bg-red-500 w-6 shadow-lg shadow-red-500/40"
                            : "bg-zinc-700 w-2 hover:bg-zinc-600"
                        } h-2 rounded-full`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de selector de artículos */}
      {showArticleSelector && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaNewspaper className="text-red-500" />
                  Seleccionar Artículo
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Busca en la base de datos y selecciona uno para comenzar
                </p>
              </div>
              <button
                onClick={() => setShowArticleSelector(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-zinc-950/50">
              <ArticleSelector
                onArticlesSelected={handleArticlesSelected}
                maxSelections={1}
                showFilters={true}
                allowReordering={false}
                includeNurOnline={true}
                includeByAuthor={true}
                includeAllPublished={true}
              />
            </div>
            <div className="p-6 border-t border-zinc-800 bg-zinc-900">
              <button
                onClick={() => setShowArticleSelector(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors border border-zinc-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

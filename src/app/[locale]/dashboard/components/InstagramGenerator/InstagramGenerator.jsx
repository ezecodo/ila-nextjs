"use client";

import React, { useState, useRef } from "react";
import { toPng } from "html-to-image";
import IlaLogo50 from "../../../components/IlaLogo/ilaLogo50";
import ArticleSelector from "../ArticleSelector/ArticleSelector"; // El mismo que ya usas
import {
  FaNewspaper,
  FaSearch,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";

// Formatos de Instagram
const FORMATS = {
  story: { name: "Historia", width: 1080, height: 1920, ratio: "9:16" },
  square: { name: "Post Cuadrado", width: 1080, height: 1080, ratio: "1:1" },
  portrait: { name: "Post Vertical", width: 1080, height: 1350, ratio: "4:5" },
};

// Plantillas disponibles
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

export default function InstagramGenerator({ initialArticle }) {
  const [format, setFormat] = useState("story");
  const [template, setTemplate] = useState("classic");
  const [customTitle, setCustomTitle] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(
    initialArticle || null,
  );
  const previewRef = useRef(null);
  const [logoSize, setLogoSize] = useState("default");

  // Datos del artículo
  const title =
    customTitle ||
    selectedArticle?.title ||
    initialArticle?.title ||
    "Feministische Gedanken zu Müll, Unreinheit und Stadtbild";

  const subtitle =
    selectedArticle?.subtitle || initialArticle?.subtitle || "Kartoffelstories";
  const author =
    selectedArticle?.authors?.[0]?.name ||
    initialArticle?.authors?.[0]?.name ||
    "Paulina Trejo Méndez";
  const imageUrl =
    selectedArticle?.images?.[0]?.url ||
    initialArticle?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800";

  const editionNumber =
    selectedArticle?.edition?.number ||
    initialArticle?.edition?.number ||
    "491";
  const editionYear =
    selectedArticle?.publicationDate?.slice(0, 4) ||
    initialArticle?.publicationDate?.slice(0, 4) ||
    "2025";

  const currentFormat = FORMATS[format];
  const scale = format === "story" ? 0.35 : 0.45;

  // Función para manejar selección de artículos (COPIADA DEL LINKS PAGE)
  const handleArticlesSelected = (articles) => {
    if (articles.length > 0) {
      const article = articles[0];
      setSelectedArticle(article);
      setCustomTitle(""); // Resetear título personalizado
      setShowArticleSelector(false);
    }
  };

  // Función para limpiar artículo seleccionado
  const clearSelectedArticle = () => {
    setSelectedArticle(null);
    setCustomTitle("");
  };

  // --- FUNCIÓN DE DESCARGA ---
  // --- FUNCIÓN DE DESCARGA CORREGIDA ---
  const downloadImage = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);

    // 1. Calculamos cuánto tenemos que "ampliar" la imagen para llegar a 1080px
    // Tu 'scale' actual es 0.35, así que el multiplicador es ~2.85
    const scaleFactor = 1 / scale;

    // 2. Definimos las dimensiones base del elemento preview (el pequeño)
    const previewWidth = currentFormat.width * scale;
    const previewHeight = currentFormat.height * scale;

    try {
      const dataUrl = await toPng(previewRef.current, {
        // IMPORTANTE: Le decimos que el ancho/base es el DEL PREVIEW (pequeño)
        width: previewWidth,
        height: previewHeight,

        // CLAVE: El pixelRatio hace la magia. Escala todo el contenido (texto, logos) proporcionalmente.
        // Resultado: Una imagen de ~1080px de ancho con todo nítido.
        pixelRatio: scaleFactor,

        cacheBust: true,
        includeQueryParams: true,

        // Limpiamos estilos para asegurar que no haya transformaciones raras
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

  const getContainerClasses = () => {
    const base = "relative overflow-hidden";
    if (template === "minimal") return `${base} bg-[#B91C1C]`;
    return `${base} bg-zinc-900`;
  };

  const getLogoPosition = () => {
    if (template === "magazine") return "absolute top-4 left-4";
    if (template === "bold") return "absolute top-6 left-1/2 -translate-x-1/2";
    return "absolute top-4 left-1/2 -translate-x-1/2";
  };

  const getTitleContainerClasses = () => {
    if (template === "bold") {
      return "absolute inset-0 flex flex-col items-center justify-center p-6 text-center";
    }
    if (template === "minimal") {
      return "absolute inset-0 flex flex-col items-center justify-center p-8 text-center";
    }
    return "absolute bottom-0 left-0 right-0 p-6";
  };

  const getTitleSize = () => {
    const baseSize = format === "story" ? "text-2xl" : "text-xl";
    if (template === "bold")
      return format === "story" ? "text-4xl" : "text-3xl";
    if (template === "minimal")
      return format === "story" ? "text-3xl" : "text-2xl";
    return baseSize;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
        
        .generator-container { font-family: 'DM Sans', sans-serif; }
        .preview-title { font-family: 'Playfair Display', Georgia, serif; }
        
        .format-btn { transition: all 0.2s ease; border: 2px solid transparent; }
        .format-btn:hover { border-color: rgba(185, 28, 28, 0.5); transform: translateY(-2px); }
        .format-btn.active { border-color: #B91C1C; background: rgba(185, 28, 28, 0.15); }
        
        .template-card { transition: all 0.3s ease; border: 2px solid rgba(255, 255, 255, 0.1); }
        .template-card:hover { border-color: rgba(185, 28, 28, 0.5); transform: scale(1.02); }
        .template-card.active { border-color: #B91C1C; box-shadow: 0 0 30px rgba(185, 28, 28, 0.3); }
        
        .download-btn { background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%); transition: all 0.3s ease; }
        .download-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 40px rgba(185, 28, 28, 0.4); }
        .download-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .preview-wrapper { background: linear-gradient(135deg, #18181b 0%, #0a0a0a 100%); border: 1px solid rgba(255, 255, 255, 0.1); }
      `}</style>

      <div className="generator-container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-block mb-4">
            <IlaLogo50
              size="mini"
              isLink={false}
              animated={false}
              show50={true}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            Generador de Instagram
          </h1>
          <p className="text-zinc-400">
            Crea contenido visual para redes sociales
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Panel de controles */}
          <div className="space-y-6 md:space-y-8">
            {/* Selector de formato */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-sm">
                  1
                </span>
                Formato
              </h2>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {Object.entries(FORMATS).map(([key, f]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`format-btn p-3 md:p-4 rounded-xl bg-zinc-900 ${format === key ? "active" : ""}`}
                  >
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">{f.ratio}</div>
                    <div className="text-xs text-zinc-600 hidden md:block">
                      {f.width}×{f.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de plantilla */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-sm">
                  2
                </span>
                Plantilla
              </h2>
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setTemplate(key)}
                    className={`template-card p-3 md:p-4 rounded-xl bg-zinc-900 text-left ${template === key ? "active" : ""}`}
                  >
                    <div className="font-medium text-sm md:text-base">
                      {t.name}
                    </div>
                    <div className="text-xs text-zinc-500 mt-1 hidden md:block">
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de contenido */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-sm">
                  3
                </span>
                Contenido
              </h2>
              <div className="space-y-4">
                {/* Selector de artículo */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Seleccionar artículo
                  </label>
                  {selectedArticle ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FaNewspaper className="text-red-500" />
                            <span className="text-sm font-medium text-white">
                              Artículo seleccionado
                            </span>
                          </div>
                          <h4 className="text-white font-medium line-clamp-2">
                            {selectedArticle.title}
                          </h4>
                          {selectedArticle.authors?.[0]?.name && (
                            <p className="text-xs text-zinc-400 mt-1">
                              por {selectedArticle.authors[0].name}
                            </p>
                          )}
                          {selectedArticle.images?.[0]?.url && (
                            <div className="mt-3 w-full h-24 rounded overflow-hidden">
                              <img
                                src={selectedArticle.images[0].url}
                                alt={selectedArticle.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            {selectedArticle.edition && (
                              <span className="text-xs px-2 py-1 bg-zinc-800 rounded">
                                Dossier #{selectedArticle.edition.number}
                              </span>
                            )}
                            {selectedArticle.isNurOnline && (
                              <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
                                🌐 Nur Online
                              </span>
                            )}
                          </div>
                          <div className="mt-3">
                            <a
                              href={`https://ila-web.de${selectedArticle.legacyPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                            >
                              <FaExternalLinkAlt size={10} />
                              Ver artículo en ila-web.de
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={clearSelectedArticle}
                          className="ml-2 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
                          title="Quitar artículo"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowArticleSelector(true)}
                      className="w-full p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-700/50 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-3"
                    >
                      <FaSearch className="text-red-500" />
                      <span className="text-sm font-medium">
                        Buscar artículo existente
                      </span>
                    </button>
                  )}
                </div>

                {/* Título personalizado */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Título personalizado (opcional)
                  </label>
                  <textarea
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={title}
                    className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-red-700 focus:outline-none resize-none text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    {selectedArticle
                      ? "Sobreescribe el título del artículo seleccionado"
                      : "Título por defecto si no hay artículo seleccionado"}
                  </p>
                </div>

                {/* Tamaño del logo */}
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Tamaño del logo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOGO_SIZE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setLogoSize(option.value)}
                        className={`p-3 md:p-4 rounded-lg text-sm font-medium transition-all ${
                          logoSize === option.value
                            ? "bg-red-700 text-white shadow-lg shadow-red-900/30"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                        }`}
                      >
                        {option.name}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${logoSize === "mini" ? "bg-red-500" : "bg-zinc-700"}`}
                      />
                      <span className="text-xs text-zinc-500">Mini</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-full ${logoSize === "default" ? "bg-red-500" : "bg-zinc-700"}`}
                      />
                      <span className="text-xs text-zinc-500">Grande</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full ${logoSize === "large" ? "bg-red-500" : "bg-zinc-700"}`}
                      />
                      <span className="text-xs text-zinc-500">
                        Extra Grande
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón de descarga */}
            <button
              onClick={downloadImage}
              disabled={isExporting}
              className="download-btn w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3"
            >
              {isExporting ? (
                <>
                  <svg
                    className="w-6 h-6 animate-spin"
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
                  Exportando...
                </>
              ) : (
                <>
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Descargar PNG
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">Vista Previa</h2>
            <div className="preview-wrapper rounded-2xl p-4 md:p-6 flex items-center justify-center">
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
                    {/* Cambiamos el div de fondo por una img real para mejor soporte CORS */}
                    <img
                      src={imageUrl}
                      crossOrigin="anonymous" // <--- ESTO ES VITAL
                      alt=""
                      className="absolute inset-0 object-cover w-full"
                      style={{
                        height:
                          template === "bold"
                            ? "100%"
                            : format === "story"
                              ? "55%"
                              : "65%",
                      }}
                    />
                    {template === "bold" && (
                      <div className="absolute inset-0 bg-black/55" />
                    )}
                    {(template === "classic" || template === "magazine") && (
                      <div
                        className="absolute left-0 right-0 bottom-0"
                        style={{
                          height: format === "story" ? "55%" : "50%",
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 40%, transparent 100%)",
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
                    className="absolute top-4 right-4 bg-red-700 px-3 py-1.5 rounded"
                    style={{ fontSize: format === "story" ? "14px" : "12px" }}
                  >
                    <span className="text-white font-bold">
                      {editionNumber}/{editionYear}
                    </span>
                  </div>
                )}

                <div className={getTitleContainerClasses()}>
                  {template === "minimal" && <div className="flex-1" />}

                  <h3
                    className={`preview-title text-white font-bold leading-tight ${getTitleSize()}`}
                    style={{
                      maxWidth: "95%",
                      textShadow:
                        template === "minimal"
                          ? "none"
                          : "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    {title}
                  </h3>

                  {template !== "minimal" && (
                    <p
                      className="text-white/80 mt-3"
                      style={{ fontSize: format === "story" ? "14px" : "12px" }}
                    >
                      von {author}
                    </p>
                  )}

                  {template === "minimal" && <div className="flex-1" />}
                </div>

                {(template === "classic" || template === "magazine") && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#B91C1C]" />
                )}
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-zinc-500">
              {currentFormat.width} × {currentFormat.height} px •{" "}
              {currentFormat.name}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de selector de artículos - USANDO EL MISMO COMPONENTE QUE YA FUNCIONA */}
      {showArticleSelector && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Seleccionar Artículo
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Busca y selecciona un artículo para generar contenido de
                  Instagram
                </p>
              </div>
              <button
                onClick={() => setShowArticleSelector(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* ¡AQUÍ ESTÁ LA CLAVE! Usamos EXACTAMENTE el mismo ArticleSelector que ya funciona */}
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

            <div className="p-6 border-t border-zinc-800 bg-zinc-950">
              <button
                onClick={() => setShowArticleSelector(false)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
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

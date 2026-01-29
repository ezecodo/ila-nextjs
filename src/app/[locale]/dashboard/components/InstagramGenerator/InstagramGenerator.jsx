import React, { useState, useRef } from "react";

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

// Componente principal
export default function InstagramGenerator({ article }) {
  const [format, setFormat] = useState("story");
  const [template, setTemplate] = useState("classic");
  const [customTitle, setCustomTitle] = useState("");
  const canvasRef = useRef(null);

  // Datos del artículo (con fallbacks para demo)
  const title =
    customTitle ||
    article?.title ||
    "Feministische Gedanken zu Müll, Unreinheit und Stadtbild";
  const subtitle = article?.subtitle || "Kartoffelstories";
  const author = article?.authors?.[0]?.name || "Paulina Trejo Méndez";
  const imageUrl =
    article?.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800";
  const editionNumber = article?.edition?.number || "491";
  const editionYear = article?.publicationDate?.slice(0, 4) || "2025";

  const currentFormat = FORMATS[format];
  const scale = 0.3; // Escala para preview

  // Función para descargar como PNG
  const downloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Crear canvas a tamaño real
    const realCanvas = document.createElement("canvas");
    realCanvas.width = currentFormat.width;
    realCanvas.height = currentFormat.height;
    const ctx = realCanvas.getContext("2d");

    // Renderizar según plantilla
    await renderToCanvas(ctx, currentFormat.width, currentFormat.height);

    // Descargar
    const link = document.createElement("a");
    link.download = `ila-instagram-${format}-${Date.now()}.png`;
    link.href = realCanvas.toDataURL("image/png");
    link.click();
  };

  const renderToCanvas = async (ctx, width, height) => {
    const ILA_RED = "#B91C1C";

    // Fondo
    ctx.fillStyle = template === "minimal" ? ILA_RED : "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    // Cargar imagen si no es minimal
    if (template !== "minimal" && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageUrl;
      });

      if (template === "bold") {
        // Imagen de fondo completa con overlay
        ctx.drawImage(img, 0, 0, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, 0, width, height);
      } else if (template === "classic" || template === "magazine") {
        // Imagen en la parte superior
        const imgHeight = format === "story" ? height * 0.5 : height * 0.6;
        ctx.drawImage(img, 0, 0, width, imgHeight);
      }
    }

    // Logo ILA (texto simplificado)
    ctx.fillStyle = "white";
    ctx.font = `bold ${width * 0.12}px "Futura", sans-serif`;
    ctx.textAlign = template === "magazine" ? "left" : "center";

    const logoX = template === "magazine" ? width * 0.08 : width / 2;
    const logoY = template === "bold" ? height * 0.12 : width * 0.15;
    ctx.fillText("ıla", logoX, logoY);

    // 50 al lado
    ctx.font = `bold ${width * 0.05}px "Futura", sans-serif`;
    const fiftyX =
      template === "magazine" ? width * 0.22 : width / 2 + width * 0.1;
    ctx.fillText("50", fiftyX, logoY - width * 0.05);

    // Título
    ctx.fillStyle = "white";
    ctx.textAlign = "center";

    let titleY, titleSize, maxWidth;

    if (template === "bold") {
      titleSize = width * 0.08;
      titleY = height * 0.5;
      maxWidth = width * 0.85;
    } else if (template === "minimal") {
      titleSize = width * 0.07;
      titleY = height * 0.45;
      maxWidth = width * 0.8;
    } else {
      titleSize = width * 0.055;
      titleY = format === "story" ? height * 0.6 : height * 0.72;
      maxWidth = width * 0.9;
    }

    ctx.font = `bold ${titleSize}px "Georgia", serif`;
    wrapText(ctx, title, width / 2, titleY, maxWidth, titleSize * 1.2);

    // Autor
    if (template !== "minimal") {
      ctx.font = `${width * 0.035}px "Helvetica", sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      const authorY = format === "story" ? height * 0.85 : height * 0.92;
      ctx.fillText(`von ${author}`, width / 2, authorY);
    }

    // Edición (para template magazine)
    if (template === "magazine") {
      ctx.fillStyle = ILA_RED;
      ctx.fillRect(width * 0.75, height * 0.05, width * 0.2, height * 0.06);
      ctx.fillStyle = "white";
      ctx.font = `bold ${width * 0.035}px "Helvetica", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(
        `${editionNumber}/${editionYear}`,
        width * 0.85,
        height * 0.085,
      );
    }

    // Barra roja inferior
    if (template === "classic" || template === "magazine") {
      ctx.fillStyle = ILA_RED;
      ctx.fillRect(0, height - height * 0.02, width, height * 0.02);
    }
  };

  // Helper para texto con wrap
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line = "";
    let testY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, testY);
        line = words[n] + " ";
        testY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, testY);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
        
        .generator-container {
          font-family: 'DM Sans', sans-serif;
        }
        
        .preview-title {
          font-family: 'Playfair Display', serif;
        }
        
        .format-btn {
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        
        .format-btn:hover {
          border-color: rgba(185, 28, 28, 0.5);
          transform: translateY(-2px);
        }
        
        .format-btn.active {
          border-color: #B91C1C;
          background: rgba(185, 28, 28, 0.15);
        }
        
        .template-card {
          transition: all 0.3s ease;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        
        .template-card:hover {
          border-color: rgba(185, 28, 28, 0.5);
          transform: scale(1.02);
        }
        
        .template-card.active {
          border-color: #B91C1C;
          box-shadow: 0 0 30px rgba(185, 28, 28, 0.3);
        }
        
        .download-btn {
          background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
          transition: all 0.3s ease;
        }
        
        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(185, 28, 28, 0.4);
        }
        
        .preview-container {
          background: linear-gradient(135deg, #18181b 0%, #0a0a0a 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <div className="generator-container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl font-bold tracking-tight">ıla</span>
            <span className="text-2xl font-bold text-red-600">50</span>
          </div>
          <h1 className="text-3xl font-semibold mb-2">
            Generador de Instagram
          </h1>
          <p className="text-zinc-400">
            Crea contenido visual para redes sociales
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Panel de controles */}
          <div className="space-y-8">
            {/* Selector de formato */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-sm">
                  1
                </span>
                Formato
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(FORMATS).map(([key, f]) => (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    className={`format-btn p-4 rounded-xl bg-zinc-900 ${format === key ? "active" : ""}`}
                  >
                    <div className="text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">{f.ratio}</div>
                    <div className="text-xs text-zinc-600">
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
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => setTemplate(key)}
                    className={`template-card p-4 rounded-xl bg-zinc-900 text-left ${template === key ? "active" : ""}`}
                  >
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de título */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-sm">
                  3
                </span>
                Personalizar
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Título (opcional)
                  </label>
                  <textarea
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={title}
                    className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-800 focus:border-red-700 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Botón de descarga */}
            <button
              onClick={downloadImage}
              className="download-btn w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3"
            >
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
            </button>
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold mb-4">Vista Previa</h2>
            <div
              className="preview-container rounded-2xl p-6 flex items-center justify-center"
              style={{
                width: currentFormat.width * scale + 48,
                minHeight: format === "story" ? 600 : 400,
              }}
            >
              {/* Preview visual (simplificado con CSS) */}
              <div
                className="relative overflow-hidden rounded-lg shadow-2xl"
                style={{
                  width: currentFormat.width * scale,
                  height: currentFormat.height * scale,
                  backgroundColor:
                    template === "minimal" ? "#B91C1C" : "#1a1a1a",
                }}
              >
                {/* Imagen de fondo */}
                {template !== "minimal" && (
                  <div
                    className={`absolute inset-0 bg-cover bg-center ${template === "bold" ? "opacity-40" : ""}`}
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                      height:
                        template === "bold"
                          ? "100%"
                          : format === "story"
                            ? "50%"
                            : "60%",
                    }}
                  />
                )}

                {/* Overlay para bold */}
                {template === "bold" && (
                  <div className="absolute inset-0 bg-black/50" />
                )}

                {/* Logo */}
                <div
                  className={`absolute ${template === "magazine" ? "left-4 top-4" : "left-1/2 -translate-x-1/2 top-4"} flex items-start gap-1`}
                >
                  <span
                    className="text-white font-bold"
                    style={{ fontSize: currentFormat.width * scale * 0.12 }}
                  >
                    ıla
                  </span>
                  <span
                    className="text-white font-bold"
                    style={{ fontSize: currentFormat.width * scale * 0.05 }}
                  >
                    50
                  </span>
                </div>

                {/* Badge edición */}
                {template === "magazine" && (
                  <div className="absolute top-3 right-3 bg-red-700 px-3 py-1 rounded">
                    <span className="text-white text-xs font-bold">
                      {editionNumber}/{editionYear}
                    </span>
                  </div>
                )}

                {/* Contenido inferior */}
                <div
                  className={`absolute left-0 right-0 p-4 flex flex-col ${template === "bold" ? "items-center justify-center inset-0" : "bottom-0"}`}
                  style={{
                    background:
                      template === "bold" || template === "minimal"
                        ? "transparent"
                        : "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)",
                    top:
                      template === "bold"
                        ? 0
                        : template === "minimal"
                          ? "30%"
                          : "auto",
                  }}
                >
                  <h3
                    className={`preview-title text-white font-bold leading-tight ${template === "bold" ? "text-center" : ""}`}
                    style={{
                      fontSize:
                        template === "bold"
                          ? currentFormat.width * scale * 0.065
                          : currentFormat.width * scale * 0.05,
                      maxWidth: "90%",
                    }}
                  >
                    {title}
                  </h3>

                  {template !== "minimal" && (
                    <p className="text-white/70 text-xs mt-3">von {author}</p>
                  )}
                </div>

                {/* Barra roja inferior */}
                {(template === "classic" || template === "magazine") && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-red-700" />
                )}
              </div>
            </div>

            {/* Info del formato */}
            <div className="mt-4 text-center text-sm text-zinc-500">
              {currentFormat.width} × {currentFormat.height} px •{" "}
              {currentFormat.name}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas oculto para exportar */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

"use client";
import styles from "./ilaloader.module.css";
import { useState, useEffect } from "react";

export default function IlaLoader({
  size = 150,
  speed = 1.2,
  shape = "circle",
  color = "#e63946",
  textColor = "#e63946",
  borderWidth = null,
  animationType = "spin",
  glow = false,
  text = "ila",
  rainbowMode = false,
}) {
  // Cálculos dinámicos
  const fontSize = size * 0.4;
  const calculatedBorderWidth =
    borderWidth || Math.max(2, Math.floor(size * 0.05));
  const [svgContent, setSvgContent] = useState("");

  // Cargar SVG para Latinoamérica
  useEffect(() => {
    if (shape === "latinamerica") {
      fetch("/latinamerica.svg")
        .then((response) => response.text())
        .then((svgText) => setSvgContent(svgText))
        .catch((error) => console.error("Error loading SVG:", error));
    }
  }, [shape]);

  // Función para obtener la clase de forma
  const getShapeClass = () => {
    switch (shape) {
      case "square":
        return styles.square;
      case "rounded":
        return styles.rounded;
      case "latinamerica":
        return styles.latinamerica;
      case "circle":
      default:
        return styles.round;
    }
  };

  // Función para obtener la clase de animación
  const getAnimationClass = () => {
    if (rainbowMode) return ""; // Rainbow tiene su propia animación

    switch (animationType) {
      case "pulse":
        return styles.pulse;
      case "bounce":
        return styles.bounce;
      case "wobble":
        return styles.wobble;
      case "spin":
      default:
        return styles.spin;
    }
  };

  // Función para aplicar color al SVG
  const getColoredSvg = () => {
    if (!svgContent) return "";

    if (rainbowMode) {
      // Para modo rainbow, crear gradiente con ID único
      const gradientId = `rainbow-${Date.now()}`;
      const rainbowGradient = `
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ff0000"/>
            <stop offset="16.66%" style="stop-color:#ff7f00"/>
            <stop offset="33.33%" style="stop-color:#ffff00"/>
            <stop offset="50%" style="stop-color:#00ff00"/>
            <stop offset="66.66%" style="stop-color:#0000ff"/>
            <stop offset="83.33%" style="stop-color:#4b0082"/>
            <stop offset="100%" style="stop-color:#9400d3"/>
          </linearGradient>
        </defs>
      `;
      return svgContent
        .replace(/<svg[^>]*>/, `$&${rainbowGradient}`)
        .replace(/stroke="[^"]*"/g, `stroke="url(#${gradientId})"`)
        .replace(/fill="[^"]*"/g, `fill="url(#${gradientId})"`);
    } else {
      // Color normal
      return svgContent
        .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
        .replace(/fill="[^"]*"/g, `fill="${color}"`);
    }
  };

  // Si es el mapa de Latinoamérica, renderizar el SVG
  if (shape === "latinamerica") {
    return (
      <div className={styles.loader} style={{ width: size, height: size }}>
        <div
          className={`${styles.svgContainer} ${getAnimationClass()} ${glow ? styles.glow : ""}`}
          style={{
            animationDuration: `${speed}s`,
            width: size,
            height: size,
            filter: glow
              ? `drop-shadow(0 0 8px ${rainbowMode ? "#ff6b6b" : color})`
              : "none",
          }}
          dangerouslySetInnerHTML={{ __html: getColoredSvg() }}
        />

        {/* Texto animado */}
        <h1
          className={`${styles.text} font-futura`}
          style={
            rainbowMode
              ? {
                  fontSize: fontSize,
                  backgroundImage:
                    "linear-gradient(to top, #FF0000 0%, #FF7F00 16%, #FFFF00 33%, #00FF00 50%, #0000FF 66%, #4B0082 83%, #9400D3 100%)",
                  backgroundSize: "100% 200%",
                  backgroundPosition: "0% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }
              : {
                  fontSize: fontSize,
                  color: textColor,
                  backgroundImage: `linear-gradient(to top, ${textColor} 0%, ${textColor} 50%, transparent 50%, transparent 100%)`,
                  backgroundSize: "100% 200%",
                  backgroundPosition: "0% 100%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }
          }
        >
          {text}
        </h1>
      </div>
    );
  }

  // Renderizado normal para otras formas
  return (
    <div className={styles.loader} style={{ width: size, height: size }}>
      {/* Círculo/borde animado */}
      <div
        className={`${styles.circle} ${getShapeClass()} ${getAnimationClass()} ${glow ? styles.glow : ""} ${rainbowMode ? styles.rainbow : ""}`}
        style={{
          animationDuration: `${speed}s`,
          ...(rainbowMode
            ? {
                // Rainbow mode - el borde se crea con el gradiente de fondo
              }
            : {
                // Modo normal
                borderWidth: `${calculatedBorderWidth}px`,
                borderLeftColor: color,
                borderRightColor: color,
                borderBottomColor: color,
                borderTopColor: "transparent",
                color: color,
              }),
          // Ajustar el grosor del borde rainbow con CSS variable
          "--border-width": `${calculatedBorderWidth}px`,
        }}
      />

      {/* Texto animado */}
      <h1
        className={`${styles.text} font-futura`}
        style={
          rainbowMode
            ? {
                fontSize: fontSize,
                backgroundImage:
                  "linear-gradient(to top, #FF0000 0%, #FF7F00 16%, #FFFF00 33%, #00FF00 50%, #0000FF 66%, #4B0082 83%, #9400D3 100%)",
                backgroundSize: "100% 200%",
                backgroundPosition: "0% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }
            : {
                fontSize: fontSize,
                backgroundImage: `linear-gradient(to top, ${textColor} 0%, ${textColor} 50%, transparent 50%, transparent 100%)`,
                backgroundSize: "100% 200%",
                backgroundPosition: "0% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }
        }
      >
        {text}
      </h1>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./IlaLogo.module.css";

export default function IlaLogo({
  size = "default", // "compact" | "default" | "large"
  isLink = true,
  onClick,
  className = "",
  animated = true,
  animationType = "hover-scale", // "hover-scale" | "entrance" | "pulse" | "shake" | "none"
  variant = "white-outline", // ver variantConfig para opciones
}) {
  const [clicked, setClicked] = useState(false);

  // Configuraciones de tamaño
  const sizeConfig = {
    mini: {
      width: 80,
      height: 80,
      fontSize: 108,
      yPosition: 130,
    },
    compact: {
      width: 96, // era 80
      height: 96, // era 80
      fontSize: 132, // era 110
      yPosition: 132,
    },
    default: { width: 168, height: 168, fontSize: 162, yPosition: 145 }, // era 140/135
    large: { width: 240, height: 240, fontSize: 216, yPosition: 160 }, // era 200/180
  };

  const config = sizeConfig[size] || sizeConfig.default;

  // Configuraciones de variantes visuales
  const variantConfig = {
    // Original - Blanco con contorno negro
    "white-outline": {
      fill: "white",
      stroke: "#000000",
      strokeWidth: 1.5,
      shadowStroke: "#000000",
      shadowOpacity: 0.3,
    },
    // Rojo sólido - Para fondos claros
    "red-solid": {
      fill: "#cc0000",
      stroke: "none",
      strokeWidth: 0,
      shadowStroke: "#000000",
      shadowOpacity: 0.2,
    },
    // Rojo con contorno blanco - Para fondos oscuros
    "red-white-outline": {
      fill: "#cc0000",
      stroke: "#ffffff",
      strokeWidth: 2,
      shadowStroke: "#000000",
      shadowOpacity: 0.3,
    },
    // Negro sólido - Minimalista
    "black-solid": {
      fill: "#000000",
      stroke: "none",
      strokeWidth: 0,
      shadowStroke: "#000000",
      shadowOpacity: 0.1,
    },
    // Blanco sólido sin contorno - Clean
    "white-solid": {
      fill: "#ffffff",
      stroke: "none",
      strokeWidth: 0,
      shadowStroke: "#000000",
      shadowOpacity: 0.2,
    },
    // Gradiente dorado - Premium
    gold: {
      fill: "#D4AF37",
      stroke: "#8B7500",
      strokeWidth: 1,
      shadowStroke: "#000000",
      shadowOpacity: 0.3,
    },
    // Neón - Moderno/llamativo
    "neon-red": {
      fill: "#ff0040",
      stroke: "#ffffff",
      strokeWidth: 1,
      shadowStroke: "#ff0040",
      shadowOpacity: 0.6,
    },
    // Vintage - Estilo retro
    vintage: {
      fill: "#8B0000",
      stroke: "#F5DEB3",
      strokeWidth: 2,
      shadowStroke: "#000000",
      shadowOpacity: 0.4,
    },
  };

  const colors = variantConfig[variant] || variantConfig["white-outline"];
  // Clases de animación según el tipo
  const getAnimationClasses = () => {
    if (!animated || animationType === "none") return "";

    switch (animationType) {
      case "entrance":
        return styles["logo-entrance"];
      case "pulse":
        return styles["logo-pulse"];
      case "shake":
        return styles["logo-shake"];
      case "hover-scale":
      default:
        return "hover:scale-105";
    }
  };

  // Manejo del click
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    if (animated) {
      setClicked(true);
      setTimeout(() => setClicked(false), 300);
    }
  };

  // SVG
  const LogoContent = () => (
    <svg
      width={config.width}
      height={config.height}
      viewBox="0 0 200 200"
      className={`transition-all duration-300 ${getAnimationClasses()} ${className} ${clicked ? "scale-95" : ""}`}
      onClick={handleClick}
    >
      {/* Cuadrado rojo ILA */}
      {/*   <rect
        width="200"
        height="200"
        fill="#cc0000"
        className="transition-all duration-300"
      /> */}

      {/* Primero el contorno (sombra) */}
      <text
        x="100"
        y={config.yPosition}
        textAnchor="middle"
        fill="none"
        stroke={colors.shadowStroke}
        strokeWidth="4"
        strokeLinejoin="round"
        fontFamily="Futura, sans-serif"
        fontSize={config.fontSize}
        fontWeight="bold"
        letterSpacing="-4"
        opacity={colors.shadowOpacity}
      >
        ila
      </text>

      <text
        x="100"
        y={config.yPosition}
        textAnchor="middle"
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={colors.strokeWidth}
        strokeLinejoin="round"
        paintOrder="stroke"
        fontFamily="Futura, sans-serif"
        fontSize={config.fontSize}
        fontWeight="bold"
        letterSpacing="-4"
      >
        ila
      </text>
    </svg>
  );

  // Render con o sin Link
  if (isLink) {
    return (
      <Link href="/" className="shrink-0" onClick={handleClick}>
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}

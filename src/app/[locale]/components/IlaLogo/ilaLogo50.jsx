"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function IlaLogo50({
  size = "default",
  isLink = true,
  onClick,
  className = "",
  animated = true,
  animationType = "hover-scale",
  show50 = true,
}) {
  const [clicked, setClicked] = useState(false);

  const sizeConfig = {
    mini: {
      width: 80,
      height: 80,
      fontSize: 60,
      letterSpacing: 0,
      map: { width: 12, height: 26, top: 12, left: 6 },
      fifty: { fontSize: 20, top: 14, right: 8 },
    },
    mobile: {
      width: 80,
      height: 80,
      fontSize: 60,
      letterSpacing: 0,
      map: { width: 12, height: 26, top: 10, left: 6 },
      fifty: { fontSize: 19, top: 14, right: -6 }, // ajustado para mobile
    },
    compact: {
      width: 96,
      height: 96,
      fontSize: 132,
      map: { width: 17, height: 36, top: -1, left: 1 },
      fifty: { fontSize: 28, top: 5, right: 6 },
    },
    default: {
      width: 168,
      height: 168,
      fontSize: 162,
      map: { width: 30, height: 64, top: -2, left: 2 },
      fifty: { fontSize: 48, top: 8, right: 10 },
    },
    large: {
      width: 240,
      height: 240,
      fontSize: 216,
      map: { width: 43, height: 91, top: -3, left: 3 },
      fifty: { fontSize: 69, top: 11, right: 14 },
    },
  };

  const config = sizeConfig[size] || sizeConfig.default;

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (animated) {
      setClicked(true);
      setTimeout(() => setClicked(false), 300);
    }
  };

  // Detectar si es animación LGBT+
  const isLGBT = animationType.startsWith("lgbt-");

  // Clases de animación para el contenedor
  const getContainerClasses = () => {
    if (!animated || animationType === "none") return "";

    switch (animationType) {
      case "hover-scale":
        return "hover:scale-105 transition-transform duration-300";
      case "entrance":
        return "animate-fadeIn";
      case "entrance-stagger":
        return "";
      case "pulse":
        return "animate-pulse-subtle";
      case "float":
        return "";
      case "glow":
        return "hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all duration-300";
      case "lgbt-gradient":
        return "";
      case "lgbt-hover":
        return "lgbt-hover-effect";
      case "lgbt-glow":
        return "lgbt-glow-effect";
      case "lgbt-pulse":
        return "lgbt-pulse-effect";
      default:
        return "";
    }
  };

  // Clases para el mapa
  const getMapClasses = () => {
    if (!animated) return "";

    switch (animationType) {
      case "entrance-stagger":
        return "animate-fadeInDown animation-delay-0";
      case "float":
        return "animate-float";
      default:
        return "";
    }
  };

  // Clases para el texto "ila"
  const getTextClasses = () => {
    if (!animated) return "";

    switch (animationType) {
      case "entrance-stagger":
        return "animate-fadeInUp animation-delay-200";
      default:
        return "";
    }
  };

  // Clases para el "50"
  const getFiftyClasses = () => {
    if (!animated) return "";

    switch (animationType) {
      case "entrance-stagger":
        return "animate-fadeInRight animation-delay-400";
      case "float":
        return "animate-float-delayed";
      case "fifty-pulse":
        return "animate-fifty-pulse";
      case "fifty-pulse-green":
        return "animate-fifty-pulse-green";
      default:
        return "";
    }
  };

  // Obtener el fill del texto según animación
  const getTextFill = () => {
    if (animationType === "lgbt-gradient") {
      return "url(#lgbt-gradient)";
    }
    return "white";
  };

  const LogoContent = () => (
    <div
      className={`relative inline-block ${getContainerClasses()} ${className} ${clicked ? "scale-95" : ""}`}
      style={{ width: config.width, height: config.height }}
      onClick={handleClick}
    >
      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: scale(-1, -1) rotate(-27deg) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(-1, -1) rotate(-27deg) translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse-subtle {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: scale(-1, -1) rotate(-27deg) translateY(0px);
          }
          50% {
            transform: scale(-1, -1) rotate(-27deg) translateY(-5px);
          }
        }

        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        @keyframes rainbow-shift {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
          }
        }

        @keyframes lgbt-glow-anim {
          0% {
            filter: drop-shadow(0 0 10px #ff0000);
          }
          16% {
            filter: drop-shadow(0 0 15px #ff8c00);
          }
          33% {
            filter: drop-shadow(0 0 15px #ffff00);
          }
          50% {
            filter: drop-shadow(0 0 15px #00ff00);
          }
          66% {
            filter: drop-shadow(0 0 15px #0000ff);
          }
          83% {
            filter: drop-shadow(0 0 15px #8b00ff);
          }
          100% {
            filter: drop-shadow(0 0 10px #ff0000);
          }
        }
        @keyframes fifty-pulse {
          0%,
          100% {
            transform: scale(1);
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
          }
          50% {
            transform: scale(1.1);
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
          }
        }
        @keyframes fifty-pulse-green {
          0%,
          100% {
            transform: scale(1);
            text-shadow: 0 0 5px rgba(137, 184, 129, 0.4);
          }
          50% {
            transform: scale(1.1);
            text-shadow:
              0 0 20px rgba(137, 184, 129, 1),
              0 0 40px rgba(137, 184, 129, 0.6);
          }
        }

        .animate-fifty-pulse-green {
          animation: fifty-pulse-green 1.5s ease-in-out infinite;
        }

        .animate-fifty-pulse {
          animation: fifty-pulse 1.5s ease-in-out infinite;
        }
        @keyframes lgbt-pulse-anim {
          0% {
            transform: scale(1);
            filter: hue-rotate(0deg);
          }
          25% {
            transform: scale(1.03);
          }
          50% {
            transform: scale(1);
            filter: hue-rotate(180deg);
          }
          75% {
            transform: scale(1.03);
          }
          100% {
            transform: scale(1);
            filter: hue-rotate(360deg);
          }
        }

        @keyframes gradient-move {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-fadeInRight {
          animation: fadeInRight 0.6s ease-out forwards;
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animation-delay-0 {
          animation-delay: 0ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
          opacity: 0;
          animation-fill-mode: forwards;
        }

        .lgbt-hover-effect {
          transition: filter 0.3s ease;
        }

        .lgbt-hover-effect:hover {
          animation: rainbow-shift 2s linear infinite;
        }

        .lgbt-glow-effect {
          animation: lgbt-glow-anim 3s ease-in-out infinite;
        }

        .lgbt-pulse-effect {
          animation: lgbt-pulse-anim 4s ease-in-out infinite;
        }
      `}</style>

      {/* Mapa de Latinoamérica */}
      <div
        className={`absolute z-10 ${getMapClasses()}`}
        style={{
          top: config.map.top,
          left: config.map.left,
          width: config.map.width,
          height: config.map.height,
          transform:
            animationType === "float" || animationType === "entrance-stagger"
              ? undefined
              : "scale(-1, -1) rotate(-27deg)",
        }}
      >
        <Image
          src="/logo/Lateinamerika_ohne_Grenzen_weiss.png"
          alt=""
          fill
          className="object-contain"
          style={
            animationType === "lgbt-gradient"
              ? { filter: "brightness(0) invert(1)" }
              : {}
          }
        />
      </div>

      {/* Texto "ıla" */}
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className={`absolute inset-0 ${getTextClasses()}`}
      >
        {/* Definición del gradiente LGBT+ */}
        {animationType === "lgbt-gradient" && (
          <defs>
            <linearGradient
              id="lgbt-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#ff0000">
                <animate
                  attributeName="stop-color"
                  values="#ff0000;#ff8c00;#ffff00;#00ff00;#0000ff;#8b00ff;#ff0000"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="16%" stopColor="#ff8c00">
                <animate
                  attributeName="stop-color"
                  values="#ff8c00;#ffff00;#00ff00;#0000ff;#8b00ff;#ff0000;#ff8c00"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="33%" stopColor="#ffff00">
                <animate
                  attributeName="stop-color"
                  values="#ffff00;#00ff00;#0000ff;#8b00ff;#ff0000;#ff8c00;#ffff00"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#00ff00">
                <animate
                  attributeName="stop-color"
                  values="#00ff00;#0000ff;#8b00ff;#ff0000;#ff8c00;#ffff00;#00ff00"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="66%" stopColor="#0000ff">
                <animate
                  attributeName="stop-color"
                  values="#0000ff;#8b00ff;#ff0000;#ff8c00;#ffff00;#00ff00;#0000ff"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="83%" stopColor="#8b00ff">
                <animate
                  attributeName="stop-color"
                  values="#8b00ff;#ff0000;#ff8c00;#ffff00;#00ff00;#0000ff;#8b00ff"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#ff0000">
                <animate
                  attributeName="stop-color"
                  values="#ff0000;#ff8c00;#ffff00;#00ff00;#0000ff;#8b00ff;#ff0000"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>
          </defs>
        )}

        <text
          x="50%"
          y="85%"
          textAnchor="middle"
          fill={getTextFill()}
          fontFamily="'Futura PT', Futura, 'Jost', sans-serif"
          fontSize={config.fontSize}
          fontWeight="600"
          letterSpacing={config.letterSpacing ?? -4}
        >
          ıla
        </text>
      </svg>

      {/* 50 */}
      {show50 && (
        <div
          className={`absolute z-10 ${getFiftyClasses()}`}
          style={{
            top: config.fifty.top,
            right: config.fifty.right,
          }}
        >
          {animationType === "lgbt-gradient" ? (
            <svg
              width={config.fifty.fontSize * 1.5}
              height={config.fifty.fontSize}
              viewBox="0 0 60 40"
            >
              <defs>
                <linearGradient
                  id="lgbt-gradient-50"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#ff0000">
                    <animate
                      attributeName="stop-color"
                      values="#ff0000;#ff8c00;#ffff00;#00ff00;#0000ff;#8b00ff;#ff0000"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="50%" stopColor="#00ff00">
                    <animate
                      attributeName="stop-color"
                      values="#00ff00;#0000ff;#8b00ff;#ff0000;#ff8c00;#ffff00;#00ff00"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </stop>
                  <stop offset="100%" stopColor="#8b00ff">
                    <animate
                      attributeName="stop-color"
                      values="#8b00ff;#ff0000;#ff8c00;#ffff00;#00ff00;#0000ff;#8b00ff"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </stop>
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="75%"
                textAnchor="middle"
                fill="url(#lgbt-gradient-50)"
                fontFamily="'Futura PT', Futura, 'Jost', sans-serif"
                fontSize="36"
                fontWeight="600"
              >
                50
              </text>
            </svg>
          ) : (
            <span
              style={{
                fontFamily: "'Futura PT', Futura, 'Jost', sans-serif",
                fontSize: config.fifty.fontSize,
                fontWeight: 600,
                color: "white",
              }}
            >
              50
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (isLink) {
    return (
      <Link href="/" className="shrink-0" onClick={handleClick}>
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}

"use client";

import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";

/**
 * ShareBar
 *
 * Props:
 * - title?: string
 * - stickyTop?: number              // fallback de top (px) en desktop si no hay ancla
 * - contentMaxWidth?: number        // ancho máx. del contenedor central (px). max-w-4xl = 1024
 * - gapFromContent?: number         // separación respecto al borde del contenido (px)
 * - className?: string
 * - anchorSelector?: string         // selector CSS para alinear la barra al inicio del contenido (ej: "#article-start")
 */
export default function ShareBar({
  title,
  stickyTop = 120,
  contentMaxWidth = 1024,
  gapFromContent = 16,
  className = "",
  anchorSelector = null,
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [left, setLeft] = useState("8px"); // posición izquierda en desktop
  const [topPx, setTopPx] = useState(stickyTop); // posición superior en desktop

  // Tomar URL en cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, []);

  // Calcular posición izquierda segura para desktop
  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeLeft = () => {
      const barWidth = 52; // ancho aprox. del bloque (icono+padding+borde)
      const gutter = (window.innerWidth - contentMaxWidth) / 2; // margen externo hasta el contenido
      const desired = Math.max(8, gutter - (gapFromContent + barWidth)); // nunca menos de 8px
      setLeft(`${desired}px`);
    };

    computeLeft();
    window.addEventListener("resize", computeLeft);
    return () => window.removeEventListener("resize", computeLeft);
  }, [contentMaxWidth, gapFromContent]);

  // Calcular top inicial en desktop, alineado al inicio del contenido si hay ancla
  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeTop = () => {
      if (anchorSelector) {
        const el = document.querySelector(anchorSelector);
        if (el) {
          const rect = el.getBoundingClientRect(); // posición respecto al viewport
          // Garantiza que no quede escondida bajo el header
          const safeTop = Math.max(64, Math.round(rect.top));
          setTopPx(safeTop);
          return;
        }
      }
      setTopPx(stickyTop);
    };

    // Ejecutar al montar y tras un pequeño delay por si hay fuentes/imagenes que reflowean
    computeTop();
    const t = setTimeout(computeTop, 250);

    window.addEventListener("resize", computeTop);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", computeTop);
    };
  }, [anchorSelector, stickyTop]);

  const encodedTitle = encodeURIComponent(
    title || "Mirá este artículo de ILA:"
  );
  const encodedURL = encodeURIComponent(url);

  const iconClass =
    "bg-white border border-red-500 text-red-600 p-2 rounded hover:bg-red-50 transition";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("No se pudo copiar el enlace.");
    }
  };

  return (
    <>
      {/* Desktop: barra vertical izquierda */}
      <div
        className={`hidden md:flex fixed z-50 flex-col items-center gap-2 ${className}`}
        style={{ top: topPx, left }}
        aria-label="Compartir artículo"
      >
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedURL}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconClass}
          title="Compartir por WhatsApp"
          aria-label="Compartir por WhatsApp"
        >
          <FaWhatsapp size={20} />
        </a>

        <a
          href={`https://t.me/share/url?url=${encodedURL}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={iconClass}
          title="Compartir por Telegram"
          aria-label="Compartir por Telegram"
        >
          <FaTelegramPlane size={20} />
        </a>

        <a
          href={`mailto:?subject=${encodedTitle}&body=${encodedURL}`}
          className={iconClass}
          title="Compartir por Email"
          aria-label="Compartir por Email"
        >
          <FaEnvelope size={20} />
        </a>

        <button
          onClick={handleCopy}
          className={iconClass}
          title="Copiar enlace"
          aria-label="Copiar enlace"
        >
          <FaLink size={20} />
        </button>

        <div
          className={`text-xs text-gray-600 bg-white border rounded px-1 py-0.5 transition-opacity ${
            copied ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-live="polite"
        >
          ¡Copiado!
        </div>
      </div>

      {/* Mobile: barra inferior */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t z-50 md:hidden">
        <div className="flex justify-around items-center px-4 py-2">
          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedURL}`}
            target="_blank"
            rel="noopener noreferrer"
            className={iconClass}
            title="Compartir por WhatsApp"
            aria-label="Compartir por WhatsApp"
          >
            <FaWhatsapp size={20} />
          </a>

          <a
            href={`https://t.me/share/url?url=${encodedURL}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className={iconClass}
            title="Compartir por Telegram"
            aria-label="Compartir por Telegram"
          >
            <FaTelegramPlane size={20} />
          </a>

          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedURL}`}
            className={iconClass}
            title="Compartir por Email"
            aria-label="Compartir por Email"
          >
            <FaEnvelope size={20} />
          </a>

          <button
            onClick={handleCopy}
            className={iconClass}
            title="Copiar enlace"
            aria-label="Copiar enlace"
          >
            <FaLink size={20} />
          </button>
        </div>
      </div>
    </>
  );
}

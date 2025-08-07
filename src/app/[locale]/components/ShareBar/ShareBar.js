"use client";

import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";
import FavoriteButton from "../FavoriteButton/FavoriteButton";

/**
 * ShareBar
 *
 * Props:
 * - title?: string
 * - stickyTop?: number               // top (px) donde se fija la barra en desktop
 * - contentMaxWidth?: number         // ancho máx. del contenedor central (px). max-w-4xl = 1024
 * - gapFromContent?: number          // separación respecto al borde del contenido (px)
 * - anchorSelector?: string          // CSS selector para alinear el top de la barra (ej: "#article-start")
 * - articleId?: number               // para mostrar el botón de favoritos
 * - className?: string
 */
export default function ShareBar({
  title,
  stickyTop = 120,
  contentMaxWidth = 1024,
  gapFromContent = 16,
  anchorSelector,
  articleId,
  className = "",
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [left, setLeft] = useState("8px"); // posición izquierda en desktop
  const [computedTop, setComputedTop] = useState(stickyTop);

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
      const barWidth = 52; // ancho aprox del botón (icono + padding + borde)
      const gutter = (window.innerWidth - contentMaxWidth) / 2;
      const desired = Math.max(8, gutter - (gapFromContent + barWidth));
      setLeft(`${desired}px`);
    };

    computeLeft();
    window.addEventListener("resize", computeLeft);
    return () => window.removeEventListener("resize", computeLeft);
  }, [contentMaxWidth, gapFromContent]);

  // Alinear con ancla si existe
  useEffect(() => {
    if (!anchorSelector) return;
    const el = document.querySelector(anchorSelector);
    if (!el) return;

    const updateTop = () => {
      const rect = el.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || 0;
      // Fijamos la barra a la altura del ancla + un pequeño offset
      setComputedTop(rect.top + scrollTop);
    };

    updateTop();
    window.addEventListener("resize", updateTop);
    window.addEventListener("load", updateTop);
    setTimeout(updateTop, 0);

    return () => {
      window.removeEventListener("resize", updateTop);
      window.removeEventListener("load", updateTop);
    };
  }, [anchorSelector]);

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
        className={`hidden md:flex fixed z-40 flex-col items-center gap-2 ${className}`}
        style={{ top: computedTop, left }}
        aria-label="Compartir artículo"
      >
        {/* Favorito (con contador pequeñito) */}
        {typeof articleId !== "undefined" && articleId !== null && (
          <FavoriteButton
            articleId={articleId}
            className={iconClass}
            size={20}
            showCount={true}
          />
        )}

        {/* WhatsApp */}
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

        {/* Telegram */}
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

        {/* Email */}
        <a
          href={`mailto:?subject=${encodedTitle}&body=${encodedURL}`}
          className={iconClass}
          title="Compartir por Email"
          aria-label="Compartir por Email"
        >
          <FaEnvelope size={20} />
        </a>

        {/* Copiar enlace */}
        <button
          onClick={handleCopy}
          className={iconClass}
          title="Copiar enlace"
          aria-label="Copiar enlace"
        >
          <FaLink size={20} />
        </button>

        {/* Aviso 'copiado' */}
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
          {/* Favorito (sin contador para mobile) */}
          {typeof articleId !== "undefined" && articleId !== null && (
            <FavoriteButton articleId={articleId} className={iconClass} />
          )}

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

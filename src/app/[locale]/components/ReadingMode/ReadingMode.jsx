"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

// Modo lectura tipo e-reader para suscriptores con Digital ABO.
// Overlay a pantalla completa que reusa el HTML ya transformado del artículo
// (mismas headings, imágenes y links que la página) en una columna limpia.
// Estética de marca: sans, #BD0E0D, rectángulos.

const THEMES = {
  light: {
    bg: "#faf9f7",
    text: "#2b2b2b",
    muted: "#6b7280",
    barBg: "#ffffff",
    barBorder: "#e5e7eb",
  },
  sepia: {
    bg: "#f4ecd8",
    text: "#5b4636",
    muted: "#8a7a5c",
    barBg: "#efe6cf",
    barBorder: "#e0d3b0",
  },
  dark: {
    bg: "#0e0e0e",
    text: "#d9d9d9",
    muted: "#8a8a8a",
    barBg: "#161616",
    barBorder: "#2a2a2a",
  },
};

const THEME_ORDER = ["light", "sepia", "dark"];
const FONT_SIZES = [17, 19, 21, 24];
// Ancho de la columna de lectura (en rem). El usuario lo cicla y se guarda.
const WIDTHS = [44, 56, 68];

export default function ReadingMode({
  open,
  onClose,
  html,
  vorspann,
  title,
  subtitle,
  author,
  meta,
}) {
  const t = useTranslations("readingMode");
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("light");
  const [fontIdx, setFontIdx] = useState(1);
  const [widthIdx, setWidthIdx] = useState(1);
  const scrollRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Restaurar preferencias guardadas
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("ila-reader-theme");
      const savedFont = localStorage.getItem("ila-reader-font");
      const savedWidth = localStorage.getItem("ila-reader-width");
      if (savedTheme && THEMES[savedTheme]) setTheme(savedTheme);
      if (savedFont !== null && FONT_SIZES[Number(savedFont)] !== undefined)
        setFontIdx(Number(savedFont));
      if (savedWidth !== null && WIDTHS[Number(savedWidth)] !== undefined)
        setWidthIdx(Number(savedWidth));
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  // Bloquear scroll del body + cerrar con Esc
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const cycleTheme = () => {
    const next =
      THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
    setTheme(next);
    try {
      localStorage.setItem("ila-reader-theme", next);
    } catch {
      /* noop */
    }
  };

  const changeFont = (dir) => {
    setFontIdx((prev) => {
      const next = Math.min(FONT_SIZES.length - 1, Math.max(0, prev + dir));
      try {
        localStorage.setItem("ila-reader-font", String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  const cycleWidth = () => {
    setWidthIdx((prev) => {
      const next = (prev + 1) % WIDTHS.length;
      try {
        localStorage.setItem("ila-reader-width", String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  };

  if (!mounted || !open) return null;

  const c = THEMES[theme];
  const baseFont = FONT_SIZES[fontIdx];
  const maxWidth = `${WIDTHS[widthIdx]}rem`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ backgroundColor: c.bg, color: c.text }}
      role="dialog"
      aria-modal="true"
      aria-label={t("ariaLabel")}
    >
      {/* Barra superior */}
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-3 shrink-0 border-b"
        style={{ backgroundColor: c.barBg, borderColor: c.barBorder }}
      >
        <span
          className="shrink-0 inline-flex items-center justify-center w-8 h-8 text-lg font-bold leading-none shadow-sm"
          style={{
            color: "#ffffff",
            backgroundColor: "#BD0E0D",
            fontFamily: "var(--font-futura), 'Futura PT', Futura, sans-serif",
          }}
          aria-hidden="true"
        >
          ila
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {title}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => changeFont(-1)}
            disabled={fontIdx === 0}
            aria-label={t("decreaseFont")}
            title={t("decreaseFont")}
            className="w-8 h-8 inline-flex items-center justify-center text-sm font-bold disabled:opacity-30 hover:text-[#BD0E0D] transition-colors"
          >
            A−
          </button>
          <button
            onClick={() => changeFont(1)}
            disabled={fontIdx === FONT_SIZES.length - 1}
            aria-label={t("increaseFont")}
            title={t("increaseFont")}
            className="w-8 h-8 inline-flex items-center justify-center text-base font-bold disabled:opacity-30 hover:text-[#BD0E0D] transition-colors"
          >
            A+
          </button>
          <button
            onClick={cycleWidth}
            aria-label={t("toggleWidth")}
            title={t("toggleWidth")}
            className="hidden sm:inline-flex w-8 h-8 items-center justify-center hover:text-[#BD0E0D] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7L4 12l4 5M16 7l4 5-4 5M4 12h16"
              />
            </svg>
          </button>
          <button
            onClick={cycleTheme}
            aria-label={t("toggleTheme")}
            title={t("toggleTheme")}
            className="w-8 h-8 inline-flex items-center justify-center hover:text-[#BD0E0D] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          </button>
          <button
            onClick={onClose}
            aria-label={t("close")}
            title={t("close")}
            className="w-8 h-8 inline-flex items-center justify-center hover:text-[#BD0E0D] transition-colors ml-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <article
          className="mx-auto px-5 sm:px-8 py-10 sm:py-14 transition-[max-width] duration-300"
          style={{ maxWidth }}
        >
          <header className="mb-8">
            <h1
              className="font-bold leading-tight tracking-tight"
              style={{ fontSize: `${baseFont * 1.9}px` }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="mt-2 leading-snug"
                style={{ fontSize: `${baseFont * 1.15}px`, color: c.muted }}
              >
                {subtitle}
              </p>
            )}
            {(author || meta) && (
              <p
                className="mt-4 text-sm"
                style={{ color: "#BD0E0D" }}
              >
                {author}
                {author && meta ? " · " : ""}
                <span style={{ color: c.muted }}>{meta}</span>
              </p>
            )}
            <div
              className="mt-6 h-[2px] w-16"
              style={{ backgroundColor: "#BD0E0D" }}
            />
          </header>

          {vorspann && (
            <div
              className="ila-reader-content ila-reader-vorspann"
              style={{
                fontSize: `${baseFont * 1.12}px`,
                lineHeight: 1.6,
                borderColor: "#BD0E0D",
              }}
              dangerouslySetInnerHTML={{ __html: vorspann }}
            />
          )}

          <div
            className="ila-reader-content"
            style={{ fontSize: `${baseFont}px`, lineHeight: 1.75 }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      </div>

      <style>{`
        .ila-reader-content p { margin: 0 0 1.1em; }
        .ila-reader-content h2 { font-size: 1.5em; font-weight: 700; line-height: 1.25; margin: 1.6em 0 0.5em; color: inherit; }
        .ila-reader-content h3 { font-size: 1.25em; font-weight: 700; line-height: 1.3; margin: 1.4em 0 0.4em; color: inherit; }
        .ila-reader-content h4 { font-size: 1.05em; font-weight: 700; margin: 1.2em 0 0.3em; color: inherit; }
        .ila-reader-content a { color: #BD0E0D; text-decoration: underline; text-underline-offset: 2px; }
        .ila-reader-content strong { font-weight: 700; }
        .ila-reader-content em { font-style: italic; }
        .ila-reader-content ul, .ila-reader-content ol { margin: 0 0 1.1em 1.4em; }
        .ila-reader-content li { margin: 0 0 0.4em; }
        .ila-reader-content img { max-width: 100%; height: auto; display: block; margin: 1.5em auto; }
        .ila-reader-content figure { margin: 1.8em 0; }
        .ila-reader-content figcaption { font-size: 0.8em; font-style: italic; opacity: 0.7; margin-top: 0.5em; text-align: center; }
        .ila-reader-content blockquote { border-left: 3px solid #BD0E0D; padding-left: 1em; margin: 1.4em 0; font-style: italic; }
        .ila-reader-vorspann { border-left: 4px solid #BD0E0D; padding-left: 1em; margin: 0 0 2em; font-weight: 500; }
        .ila-reader-vorspann p:last-child { margin-bottom: 0; }
      `}</style>
    </div>,
    document.body,
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaLink,
  FaPrint,
  FaEdit,
  FaHeadphones,
  FaPause,
  FaBookOpen,
} from "react-icons/fa";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import { useArticleListen } from "../ArticleListen/ArticleListenProvider";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";

/** Item con tooltip (solo desktop). tone: "red" (compartir) | "green" (lectura/escucha) */
function ShareItem({ children, label, title, tone = "red" }) {
  const green = tone === "green";
  const circle = green
    ? "bg-white text-[#89B881] border-2 border-[#89B881] hover:bg-[#89B881] hover:text-white"
    : "bg-[#cc0000] text-white hover:bg-[#a30000]";
  const tip = green ? "bg-[#89B881]" : "bg-[#cc0000]";
  return (
    <div className="relative group hidden md:block">
      <div
        className={`${circle} p-2.5 rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer`}
        title={title}
        aria-label={label}
      >
        {children}
      </div>
      <span
        className={`pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                   whitespace-nowrap rounded ${tip} text-white text-xs font-bold px-3 py-1.5
                   opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-50`}
        role="tooltip"
      >
        {label}
      </span>
    </div>
  );
}

export default function ShareBar({
  title,
  stickyTop = 120,
  contentMaxWidth = 1024,
  gapFromContent = 16,
  anchorSelector,
  articleId,
  align = "center",
  className = "",
  onReadingMode,
  showReadingMode = false,
  readingModeLabel = "",
}) {
  const t = useTranslations("ShareBar");
  const locale = useLocale();
  const listen = useArticleListen();
  const listenLabel = listen?.isPlaying
    ? listen.isDE
      ? "Pause"
      : "Pausa"
    : listen?.isPaused
      ? listen.isDE
        ? "Weiter"
        : "Seguir"
      : listen?.isDE
        ? "Anhören"
        : "Escuchar";
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [left, setLeft] = useState("8px");
  const [computedTop, setComputedTop] = useState(stickyTop);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  // El editor v2 (publilab) está restringido a Eze mientras se termina; el resto
  // de admins van al clásico (la página edit-v2 igual redirige si no coincide).
  const editBase =
    session?.user?.email === "e.zeangeloni@gmail.com" ? "edit-v2" : "edit";
  // En la versión ES del artículo, "editar" abre el editor de traducción; en la
  // versión DE (default) abre el editor del artículo original.
  const editHref =
    locale === "es"
      ? `/dashboard/articles/translate/${articleId}`
      : `/dashboard/articles/${editBase}/${articleId}`;
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.href);
  }, []);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const computeLeft = () => {
      const barWidth = 52;
      // Si el bloque está pegado a la derecha, todo el gutter queda a la izquierda;
      // si está centrado, el gutter se reparte en dos.
      const gutter =
        align === "right"
          ? window.innerWidth - contentMaxWidth
          : (window.innerWidth - contentMaxWidth) / 2;
      const desired = Math.max(8, gutter - (gapFromContent + barWidth));
      setLeft(`${desired}px`);
    };
    computeLeft();
    window.addEventListener("resize", computeLeft);
    return () => window.removeEventListener("resize", computeLeft);
  }, [contentMaxWidth, gapFromContent, align]);

  useEffect(() => {
    if (!anchorSelector) return;
    const el = document.querySelector(anchorSelector);
    if (!el) return;
    const updateTop = () => {
      const rect = el.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop || 0;
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

  const encodedTitle = encodeURIComponent(title || t("defaultShareTitle"));
  const encodedURL = encodeURIComponent(url);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert(t("copyError"));
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      {/* Desktop */}
      <div
        className={`hidden md:flex fixed z-40 flex-col items-center gap-3 print:hidden transition-opacity duration-300 ${footerVisible ? "opacity-0 pointer-events-none" : "opacity-100"} ${className}`}
        style={{ top: computedTop, left }}
        aria-label={t("ariaShare")}
      >
        {/* Escuchar (TTS) — destacado en verde. Al activar la escucha, el hover
            sobre el ícono abre el reproductor (velocidad, voz, progreso). */}
        {listen?.canListen && (
          <div className="relative group hidden md:block">
            <button
              onClick={listen.toggle}
              className="bg-white text-[#89B881] border-2 border-[#89B881] hover:bg-[#89B881] hover:text-white p-2.5 rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer"
              title={listenLabel}
              aria-label={listenLabel}
            >
              {listen.isPlaying ? (
                <FaPause size={18} />
              ) : (
                <FaHeadphones size={20} />
              )}
            </button>

            {/* Tooltip (cuando la escucha no está activa) */}
            {!listen.active && (
              <span
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                           whitespace-nowrap rounded bg-[#89B881] text-white text-xs font-bold px-3 py-1.5
                           opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-50"
                role="tooltip"
              >
                {listenLabel}
              </span>
            )}

            {/* Reproductor (hover, escucha activa) */}
            {listen.active && listen.controls && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 pl-3 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="w-80 border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-xl rounded-none px-4 py-3">
                  {listen.controls}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modo lectura — destacado en verde */}
        {showReadingMode && onReadingMode && (
          <button onClick={onReadingMode} className="hidden md:block">
            <ShareItem
              tone="green"
              label={readingModeLabel}
              title={readingModeLabel}
            >
              <FaBookOpen size={18} />
            </ShareItem>
          </button>
        )}

        {/* Favorito */}
        {articleId != null && (
          <ShareItem label={t("favorite")} title={t("favorite")}>
            <FavoriteButton articleId={articleId} variant="icon" />
          </ShareItem>
        )}

        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedURL}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block"
        >
          <ShareItem label={t("whatsapp")} title={t("whatsapp")}>
            <FaWhatsapp size={20} />
          </ShareItem>
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodedURL}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:block"
        >
          <ShareItem label={t("telegram")} title={t("telegram")}>
            <FaTelegramPlane size={20} />
          </ShareItem>
        </a>

        {/* Email */}
        <a
          href={`mailto:?subject=${encodedTitle}&body=${encodedURL}`}
          className="hidden md:block"
        >
          <ShareItem label={t("email")} title={t("email")}>
            <FaEnvelope size={20} />
          </ShareItem>
        </a>

        {/* Copiar enlace */}
        <button onClick={handleCopy} className="hidden md:block">
          <ShareItem
            label={copied ? t("copied") : t("copyLink")}
            title={t("copyLink")}
          >
            <FaLink size={20} />
          </ShareItem>
        </button>

        {/* Imprimir */}
        <button onClick={handlePrint} className="hidden md:block">
          <ShareItem label={t("print")} title={t("printTooltip")}>
            <FaPrint size={20} />
          </ShareItem>
        </button>

        {/* Editar artículo (solo admin) */}
        {isAdmin && articleId != null && (
          <Link
            href={editHref}
            className="hidden md:block"
          >
            <ShareItem label={t("editLink")} title="Editar artículo">
              <FaEdit size={20} />
            </ShareItem>
          </Link>
        )}
      </div>

      {/* Aviso “copiado” (desktop) */}
      <div
        className={`hidden md:block fixed z-50 text-xs text-white font-bold bg-[#cc0000] rounded-full px-3 py-1 shadow-lg transition-opacity print:hidden ${
          copied
            ? "opacity-100 scale-100"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
        style={{ top: computedTop + 60, left: `calc(${left} + 10px)` }} // Ajuste de posición para que flote mejor
        aria-live="polite"
      >
        {t("copied")}
      </div>

      {/* Mobile */}
      <div className="fixed bottom-0 left-0 right-0 w-screen overflow-x-hidden bg-[#BD0E0D] text-white z-50 md:hidden print:hidden">
        <div className="flex justify-around items-center py-2">
          {listen?.canListen && (
            <button
              onClick={listen.toggle}
              className="bg-[#89B881] p-1.5 rounded-full transition-colors"
              title={listenLabel}
              aria-label={listenLabel}
            >
              {listen.isPlaying ? (
                <FaPause size={18} />
              ) : (
                <FaHeadphones size={18} />
              )}
            </button>
          )}

          {showReadingMode && onReadingMode && (
            <button
              onClick={onReadingMode}
              className="bg-[#89B881] p-1.5 rounded-full transition-colors"
              title={readingModeLabel}
              aria-label={readingModeLabel}
            >
              <FaBookOpen size={18} />
            </button>
          )}

          {articleId != null && (
            <div className="hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer">
              <FavoriteButton articleId={articleId} variant="icon" />
            </div>
          )}

          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedURL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            title={t("whatsapp")}
            aria-label={t("whatsapp")}
          >
            <FaWhatsapp size={18} />
          </a>

          <a
            href={`https://t.me/share/url?url=${encodedURL}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            title={t("telegram")}
            aria-label={t("telegram")}
          >
            <FaTelegramPlane size={18} />
          </a>

          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedURL}`}
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            title={t("email")}
            aria-label={t("email")}
          >
            <FaEnvelope size={18} />
          </a>

          <button
            onClick={handleCopy}
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors relative"
            title={t("copyLink")}
            aria-label={t("copyLink")}
          >
            <FaLink size={18} />
            {copied && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white text-red-600 px-2 py-0.5 rounded shadow">
                OK
              </span>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
            title={t("printTooltip")}
            aria-label={t("printAria")}
          >
            <FaPrint size={18} />
          </button>

          {isAdmin && articleId != null && (
            <Link
              href={editHref}
              className="hover:bg-white/10 p-1.5 rounded-full transition-colors"
              title="Editar artículo"
              aria-label="Editar artículo"
            >
              <FaEdit size={18} />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

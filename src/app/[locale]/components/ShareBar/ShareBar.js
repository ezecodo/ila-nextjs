"use client";

import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaLink,
  FaPrint,
  FaEdit,
} from "react-icons/fa";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";

/** Item con tooltip (solo desktop) - ESTILO ROJO SÓLIDO */
function ShareItem({ children, label, title }) {
  return (
    <div className="relative group hidden md:block">
      {/* 🎨 CAMBIO: Fondo rojo sólido, texto blanco y sombra para impacto visual */}
      <div
        className="bg-[#cc0000] text-white p-2.5 rounded-full hover:bg-[#a30000] transition-all shadow-md hover:shadow-lg cursor-pointer"
        title={title}
        aria-label={label}
      >
        {children}
      </div>
      {/* Tooltip mejorado */}
      <span
        className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3
                   whitespace-nowrap rounded bg-[#cc0000] text-white text-xs font-bold px-3 py-1.5
                   opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-50"
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
  className = "",
}) {
  const t = useTranslations("ShareBar");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [left, setLeft] = useState("8px");
  const [computedTop, setComputedTop] = useState(stickyTop);
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
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
      const gutter = (window.innerWidth - contentMaxWidth) / 2;
      const desired = Math.max(8, gutter - (gapFromContent + barWidth));
      setLeft(`${desired}px`);
    };
    computeLeft();
    window.addEventListener("resize", computeLeft);
    return () => window.removeEventListener("resize", computeLeft);
  }, [contentMaxWidth, gapFromContent]);

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
            href={`/dashboard/articles/edit/${articleId}`}
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
              href={`/dashboard/articles/edit/${articleId}`}
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

"use client";

import { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaEnvelope,
  FaLink,
} from "react-icons/fa";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import { useTranslations } from "next-intl";

/** Item con tooltip (solo desktop) */
function ShareItem({ children, label, title }) {
  return (
    <div className="relative group hidden md:block">
      <div
        className="bg-white border border-red-500 text-red-600 p-2 rounded hover:bg-red-50 transition cursor-pointer"
        title={title}
        aria-label={label}
      >
        {children}
      </div>
      <span
        className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2
                   whitespace-nowrap rounded bg-black/80 text-white text-sm px-2 py-1
                   opacity-0 group-hover:opacity-100 transition-opacity"
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

  useEffect(() => {
    if (typeof window !== "undefined") setUrl(window.location.href);
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

  return (
    <>
      {/* Desktop */}
      <div
        className={`hidden md:flex fixed z-40 flex-col items-center gap-2 ${className}`}
        style={{ top: computedTop, left }}
        aria-label={t("ariaShare")}
      >
        {/* Favorito (ahora en modo icon para que herede estilos del wrapper) */}
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
      </div>

      {/* Aviso “copiado” (desktop) */}
      <div
        className={`hidden md:block fixed z-40 text-xs text-gray-600 bg-white border rounded px-1 py-0.5 transition-opacity ${
          copied ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ top: computedTop, left: `calc(${left} + 0px)` }}
        aria-live="polite"
      >
        {t("copied")}
      </div>

      {/* Mobile */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t z-50 md:hidden">
        <div className="flex justify-around items-center px-4 py-2">
          {articleId != null && (
            <div className="bg-white border border-red-500 text-red-600 p-2 rounded">
              <FavoriteButton articleId={articleId} variant="icon" />
            </div>
          )}

          <a
            href={`https://wa.me/?text=${encodedTitle}%20${encodedURL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-red-500 text-red-600 p-2 rounded"
            title={t("whatsapp")}
            aria-label={t("whatsapp")}
          >
            <FaWhatsapp size={20} />
          </a>

          <a
            href={`https://t.me/share/url?url=${encodedURL}&text=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-red-500 text-red-600 p-2 rounded"
            title={t("telegram")}
            aria-label={t("telegram")}
          >
            <FaTelegramPlane size={20} />
          </a>

          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedURL}`}
            className="bg-white border border-red-500 text-red-600 p-2 rounded"
            title={t("email")}
            aria-label={t("email")}
          >
            <FaEnvelope size={20} />
          </a>

          <button
            onClick={handleCopy}
            className="bg-white border border-red-500 text-red-600 p-2 rounded"
            title={t("copyLink")}
            aria-label={t("copyLink")}
          >
            <FaLink size={20} />
          </button>
        </div>
      </div>
    </>
  );
}

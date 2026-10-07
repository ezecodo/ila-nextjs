"use client";

// Banner "entre los artículos": un banner por bloques (los de /dashboard/banners) con la
// casilla "También mostrar entre los artículos" (`blocks.inFeed`) aparece como una card
// más en las grillas de artículos (búsqueda, relacionados) y como recuadro a mitad de
// cada artículo (en lugar del banner de donación). Siempre con el chip "In eigener Sache" (arriba a la izquierda, como el
// chip de región de las cards), para que no se confunda con un artículo. Sin banner marcado, no renderiza nada.
//
// Si hay varios marcados, se muestra el primero según `order` (mismo orden que la API).
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import BannerSlide from "../SlideBanner/BannerSlide";
import { normalizeBlocks } from "../SlideBanner/blocks";

// Comparte la petición entre las instancias montadas a la vez (p. ej. grilla + final de
// artículo), pero solo por un rato: el módulo vive mientras se navega por el sitio sin
// recargar, y un resultado guardado para siempre hacía que un banner recién activado no
// apareciera hasta recargar. "Ningún banner" no se guarda (se vuelve a preguntar).
const CACHE_MS = 60 * 1000;
let bannerPromise = null;
let cachedAt = 0;

function loadInFeedBanner() {
  if (bannerPromise && Date.now() - cachedAt > CACHE_MS) bannerPromise = null;
  if (!bannerPromise) {
    cachedAt = Date.now();
    bannerPromise = (async () => {
      const res = await fetch("/api/banners");
      const list = await res.json();
      const banner =
        (Array.isArray(list) ? list : []).find(
          (b) => b.type === "custom" && normalizeBlocks(b.blocks).inFeed,
        ) || null;
      if (!banner) {
        bannerPromise = null;
        return { banner: null, stats: null };
      }

      const needsStats = normalizeBlocks(banner.blocks).items.some(
        (block) => block.type === "stats",
      );
      const stats = needsStats
        ? await fetch("/api/stats/site").then((r) => r.json())
        : null;
      return { banner, stats };
    })().catch((error) => {
      console.error("Error fetching in-feed banner:", error);
      bannerPromise = null; // reintentar en la próxima página
      return { banner: null, stats: null };
    });
  }
  return bannerPromise;
}

/**
 * @param {"card"|"inline"} variant  card = celda de grilla (estira al alto de la fila);
 *                                   inline = recuadro de ancho completo (mitad del artículo)
 * @param {string} as                elemento raíz ("div" por defecto, "li" dentro de un <ul>)
 */
export default function InFeedBanner({
  variant = "card",
  as: Tag = "div",
  className = "",
  // Lo que se muestra si no hay banner marcado (p. ej. el banner de donación a mitad
  // del artículo). Mientras carga no se muestra nada, para que no "salte" de uno al otro.
  fallback = null,
}) {
  const locale = useLocale();
  const t = useTranslations("inFeedBanner");
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadInFeedBanner().then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null; // cargando
  if (!data.banner) return fallback;

  if (variant === "inline") {
    return (
      <Tag className={`my-10 ${className}`} aria-label={t("label")}>
        <BannerSlide
          banner={data.banner}
          stats={data.stats}
          locale={locale}
          badge={t("label")}
          wide
        />
      </Tag>
    );
  }

  return (
    <Tag
      className={`flex h-full flex-col ${className}`}
      aria-label={t("label")}
    >
      <BannerSlide
        banner={data.banner}
        stats={data.stats}
        locale={locale}
        badge={t("label")}
        fill
      />
    </Tag>
  );
}

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import EntityBadges from "../EntityBadges/EntityBadges";
import HoverInfo from "../HoverInfo/HoverInfo";
import { Link as LocaleLink } from "@/i18n/navigation";
import ArticleLink from "../Articles/ArticleLink/ArticleLink";
import SmartImage from "../SmartImage/SmartImage";
import FavoriteButton from "../FavoriteButton/FavoriteButton";

const stripHTML = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export default function MiniArticleCardGrid({
  article,
  delay = 0,
  isTransitioning = false,
  selectionMode = false,
  selected = false,
  selectionIndex = null,
  onToggleSelect = null,
  onRemoveFavorite = null,
}) {
  const locale = useLocale();
  const t = useTranslations("article");
  const isES = locale === "es" && article.isTranslatedES;

  const primaryImage =
    article.images && article.images.length > 0
      ? article.images[0]
      : article.articleImage
        ? {
            url: article.articleImage,
            alt: article.imageAlt || "Imagen del artículo",
          }
        : null;

  const hasImage = Boolean(primaryImage?.url);

  const [orient, setOrient] = useState("landscape");
  useEffect(() => {
    if (!hasImage) return;
    let active = true;
    const img = new window.Image();
    img.onload = () => {
      if (!active || !img.naturalWidth || !img.naturalHeight) return;
      const r = img.naturalWidth / img.naturalHeight;
      setOrient(r > 1.05 ? "landscape" : r < 0.95 ? "portrait" : "square");
    };
    img.src = primaryImage.url;
    return () => {
      active = false;
    };
  }, [hasImage, primaryImage?.url]);

  const title = isES ? article.titleES : article.title;
  const subtitle = isES ? article.subtitleES : article.subtitle;

  let teaser = "";
  if (isES) {
    teaser =
      stripHTML(article.previewTextES) ||
      stripHTML(article.contentES)?.slice(0, 400) ||
      "";
  } else {
    teaser =
      stripHTML(article.previewText) ||
      stripHTML(article.content)?.slice(0, 400) ||
      "";
  }

  const editionYear = article.edition?.datePublished
    ? new Date(article.edition.datePublished).getFullYear()
    : article.publicationDate
      ? new Date(article.publicationDate).getFullYear()
      : null;

  const region =
    article.regions?.length > 0
      ? locale === "es" && article.regions[0].nameES
        ? article.regions[0].nameES
        : article.regions[0].name
      : null;
  const category =
    article.categories?.length > 0
      ? locale === "es" && article.categories[0].nameES
        ? article.categories[0].nameES
        : article.categories[0].name
      : null;

  const poster = hasImage && orient === "portrait";

  // Overlay de selección para armar el Paquete PDF (orden = orden de clic)
  const selectionOverlay = selectionMode ? (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSelect?.(article.id);
        }}
        className="absolute inset-0 z-20 cursor-pointer"
        aria-pressed={selected}
        aria-label={title}
      />
      <div className="absolute top-2.5 left-2.5 z-30 pointer-events-none">
        <div
          className={`flex h-7 w-7 items-center justify-center border-2 text-sm font-bold tabular-nums shadow-md ${
            selected
              ? "border-[#BD0E0D] bg-[#BD0E0D] text-white"
              : "border-white bg-white/85 text-transparent"
          }`}
        >
          {selected ? selectionIndex : ""}
        </div>
      </div>
    </>
  ) : null;

  /* ============================ PÓSTER A SANGRE (vertical) ============================ */
  if (poster) {
    return (
      <article
        className={`group relative flex h-full min-h-[380px] overflow-hidden rounded-none border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-200 dark:bg-gray-900 ${
          isTransitioning
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        } ${selected ? "ring-2 ring-[#BD0E0D] ring-inset" : ""}`}
        style={{
          transitionDelay: isTransitioning ? "0ms" : `${delay + 600}ms`,
        }}
        data-orient="portrait"
      >
        {selectionOverlay}
        {/* Link global: TODA la card es clickeable */}
        <ArticleLink article={article} className="absolute inset-0 z-[1]">
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || "Imagen del artículo"}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            style={{ objectFit: "cover", objectPosition: "50% 35%" }}
            className="transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
        </ArticleLink>

        {/* Degradado más suave y extenso para mejor legibilidad */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(10,5,5,0.92) 0%, rgba(10,5,5,0.5) 35%, rgba(10,5,5,0.1) 60%, transparent 75%)",
          }}
        />

        {/* Chip de región más integrado */}
        {region && !selectionMode && (
          <span className="absolute top-3 left-3 z-[3] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-[#BD0E0D] shadow-md">
            {region}
          </span>
        )}

        {/* Botón favoritos con fondo sutil para no perderse en la imagen */}
        <div className="absolute top-3 right-3 z-[3]">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <FavoriteButton articleId={article.id} variant="icon" />
          </div>
        </div>

        {/* Texto superpuesto: pointer-events-none deja pasar el clic al link global */}
        <div className="absolute inset-x-0 bottom-0 z-[3] p-4 pt-12 pointer-events-none">
          {(region || category) && (
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70 mb-1.5">
              {[region, category].filter(Boolean).join(" · ")}
            </div>
          )}

          <h3 className="text-xl font-bold leading-[1.15] text-white text-balance mb-2">
            <span className="bg-gradient-to-r from-white/90 to-white/90 bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
              {title}
            </span>
          </h3>

          {/* Subtítulo en póster si existe */}
          {subtitle && (
            <p className="text-sm text-white/90 leading-snug mb-2 line-clamp-2">
              {subtitle}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/20">
            {article.authors?.length > 0 ? (
              <span className="text-[12px] font-medium text-white/80 pointer-events-auto">
                {t("by")}{" "}
                {article.authors.map((author, i) => (
                  <span key={author.id}>
                    <LocaleLink
                      href={`/authors/${author.id}`}
                      className="text-white hover:underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HoverInfo
                        id={author.id}
                        name={author.name}
                        entityType="authors"
                      />
                    </LocaleLink>
                    {i < article.authors.length - 1 && ", "}
                  </span>
                ))}
              </span>
            ) : (
              <span />
            )}
            {article.edition?.number && editionYear && (
              <span className="text-[11px] font-semibold text-white/70 whitespace-nowrap tracking-wide tabular-nums">
                № {article.edition.number} · {editionYear}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  /* =================== SIN IMAGEN — PORTADA DE TEXTO (rojo ila) =================== */
  if (!hasImage) {
    return (
      <article
        className={`group relative flex h-full min-h-[380px] flex-col overflow-hidden rounded-none border border-gray-200 dark:border-gray-700 bg-[#BD0E0D] text-white shadow-sm hover:shadow-xl transition-all duration-300 ${
          isTransitioning
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        } ${selected ? "ring-2 ring-white ring-inset" : ""}`}
        style={{
          transitionDelay: isTransitioning ? "0ms" : `${delay + 600}ms`,
        }}
        data-orient="text"
      >
        {selectionOverlay}
        {/* Link global: toda la card es clickeable */}
        <ArticleLink article={article} className="absolute inset-0 z-[1]">
          <span className="sr-only">{title}</span>
        </ArticleLink>

        {/* Textura sutil de marca */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.13] bg-[radial-gradient(circle_at_22%_15%,white,transparent_60%)]" />

        {/* Favorito */}
        <div className="absolute top-3 right-3 z-[3]">
          <div className="bg-black/20 backdrop-blur-sm rounded-full p-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <FavoriteButton
              articleId={article.id}
              variant="icon"
              onRemoved={onRemoveFavorite}
            />
          </div>
        </div>

        {/* Contenido: título y subtítulo en grande ocupando la card */}
        <div className="relative z-[2] flex flex-col h-full p-5 pointer-events-none">
          {(region || category) && (
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 mb-3">
              {[region, category].filter(Boolean).join(" · ")}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-bold leading-[1.12] text-balance">
              <span className="bg-gradient-to-r from-white/90 to-white/90 bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
                {title}
              </span>
            </h3>
            {subtitle && (
              <p className="mt-3 text-base md:text-lg text-white/90 leading-snug line-clamp-4">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/20">
            {article.authors?.length > 0 ? (
              <span className="text-[12px] font-medium text-white/80 pointer-events-auto min-w-0">
                {t("by")}{" "}
                {article.authors.map((author, i) => (
                  <span key={author.id}>
                    <LocaleLink
                      href={`/authors/${author.id}`}
                      className="text-white hover:underline underline-offset-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HoverInfo
                        id={author.id}
                        name={author.name}
                        entityType="authors"
                      />
                    </LocaleLink>
                    {i < article.authors.length - 1 && ", "}
                  </span>
                ))}
              </span>
            ) : (
              <span />
            )}
            {article.edition?.number && editionYear && (
              <span className="text-[11px] font-semibold text-white/70 whitespace-nowrap tracking-wide tabular-nums">
                № {article.edition.number} · {editionYear}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  /* =================== HORIZONTAL / CUADRADA (con imagen) =================== */
  return (
    <article
      className={`group relative flex flex-col h-full rounded-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 ${
        isTransitioning
          ? "opacity-0 translate-y-4"
          : "opacity-100 translate-y-0"
      } ${selected ? "ring-2 ring-[#BD0E0D] ring-inset" : ""}`}
      style={{ transitionDelay: isTransitioning ? "0ms" : `${delay + 600}ms` }}
      data-orient={orient}
    >
      {selectionOverlay}
      {/* Área de imagen más compacta y con ratio controlado */}
      <div className="relative w-full aspect-[16/10] overflow-hidden shrink-0">
        <div className="block w-full h-full">
          <SmartImage
            src={primaryImage.url}
            alt={primaryImage.alt || "Imagen del artículo"}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            faceTopBias
          />
        </div>

        {/* Overlay sutil en hover para feedback táctil */}
        <div className="absolute inset-0 bg-[#BD0E0D]/0 group-hover:bg-[#BD0E0D]/10 transition-colors duration-300 pointer-events-none" />

        {/* Favoritos integrado en esquina con fondo */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-1 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">
            <FavoriteButton
              articleId={article.id}
              variant="compact"
              onRemoved={onRemoveFavorite}
            />
          </div>
        </div>
      </div>

      {/* Contenido más denso, menos aire */}
      <div className="flex flex-col gap-1.5 p-3.5 flex-1">
        {/* Badges más compactos — relative z-10 para quedar sobre el overlay */}
        <div className="relative z-10 flex items-start justify-between gap-2">
          <EntityBadges
            categories={article.categories}
            regions={article.regions}
            topics={article.topics}
            context="articles"
            locale={locale}
            className="[&>a]:!text-[9px] [&>a]:!px-1.5 [&>a]:!py-0.5"
          />
        </div>

        {/* Título: el link lo da el overlay de la card (un solo <a>) */}
        <h3 className="text-xl font-bold leading-[1.15] text-gray-900 dark:text-gray-100 text-balance">
          <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
            {title}
          </span>
        </h3>

        {/* Subtítulo más integrado */}
        {subtitle && (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-1">
            {subtitle}
          </p>
        )}

        {/* Teaser */}
        {teaser && (
          <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed overflow-hidden line-clamp-2">
            {teaser}
          </p>
        )}

        {/* Footer siempre al fondo — relative z-10 para que el autor sea clickeable sobre el overlay */}
        <div className="relative z-10 mt-auto pt-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2">
          {article.authors?.length > 0 ? (
            <span className="text-[12px] text-gray-500 dark:text-gray-400 min-w-0">
              {t("by")}{" "}
              {article.authors.map((author, i) => (
                <span key={author.id}>
                  <LocaleLink
                    href={`/authors/${author.id}`}
                    className="text-[#BD0E0D] hover:underline font-semibold"
                  >
                    <HoverInfo
                      id={author.id}
                      name={author.name}
                      entityType="authors"
                    />
                  </LocaleLink>
                  {i < article.authors.length - 1 && ", "}
                </span>
              ))}
            </span>
          ) : (
            <span className="flex-1" />
          )}
          {article.edition?.number && editionYear && (
            <span className="text-[11px] font-semibold text-gray-400 whitespace-nowrap tracking-wide tabular-nums">
              № {article.edition.number} · {editionYear}
            </span>
          )}
        </div>
      </div>

      {/* Link que cubre toda la card — único <a> del artículo, con nombre accesible */}
      <ArticleLink article={article} className="absolute inset-0 z-0">
        <span className="sr-only">{title}</span>
      </ArticleLink>
    </article>
  );
}

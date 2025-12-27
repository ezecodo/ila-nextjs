"use client";

import { useEffect, useState } from "react";
import SmartImage from "../../SmartImage/SmartImage";
import Slider from "../../SafeSlick/SafeSlick";
import { useLocale } from "next-intl";
import EntityBadges from "../../../components/EntityBadges/EntityBadges";
import FavoriteButton from "../../../components/FavoriteButton/FavoriteButton";
import HoverInfo from "../../../components/HoverInfo/HoverInfo";
import { Link as LocaleLink } from "@/i18n/navigation";
import { PrevArrow, NextArrow } from "../CustomArrows/CustomArrows";
import ArticleLink from "../ArticleLink/ArticleLink";
import SectionHeader from "../../SectionsHeader/SetionHeader";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// 🔥 Función para limpiar HTML
const stripHTML = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default function FilteredArticlesCarousel(props) {
  const {
    region,
    beitragstypId,
    title,
    limit,
    slidesToShow,
    isManual,
    manualArticles,
  } = props;

  const effectiveLimit = limit || 30;
  const effectiveSlidesToShow = slidesToShow || 3;

  const [articles, setArticles] = useState([]);
  const locale = useLocale();

  useEffect(() => {
    // 🆕 Si es manual, usar los artículos proporcionados
    if (isManual && manualArticles) {
      const articleIds = manualArticles.map((a) => a.id).join(",");

      fetch(`/api/articles/batch?ids=${articleIds}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("🔍 API devuelve:", data.length, "artículos");

          const orderedArticles = manualArticles
            .map((ma) => data.find((a) => a.id === ma.id))
            .filter(Boolean);

          console.log("📦 Ordenados:", orderedArticles.length);
          console.log(
            "🖼️ Con imágenes:",
            orderedArticles.filter(
              (a) => a.images?.length > 0 || a.articleImage
            ).length
          );
          console.log(
            "❌ Sin imágenes:",
            orderedArticles.filter(
              (a) => (!a.images || a.images.length === 0) && !a.articleImage
            ).length
          );

          setArticles(orderedArticles);
        })
        .catch(() => setArticles([]));

      return;
    }

    // ✅ Carrusel automático (lógica original)
    const params = new URLSearchParams();
    params.set("limit", effectiveLimit.toString());
    if (region) params.set("regionId", String(region));
    if (beitragstypId) params.set("beitragstypId", String(beitragstypId));
    params.set("locale", locale);

    fetch(`/api/articles/filtered?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = (data.articles || []).filter(
          (a) => a.images && a.images.length > 0
        );
        setArticles(filtered);
      })
      .catch((err) => {
        console.error("Error cargando artículos:", err);
        setArticles([]);
      });
  }, [region, beitragstypId, effectiveLimit, locale, isManual, manualArticles]);

  if (!articles || articles.length === 0) return null;

  const singleSlide = articles.length === 1;

  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: singleSlide ? 1 : effectiveSlidesToShow,
    slidesToScroll: 1,
    arrows: articles.length > effectiveSlidesToShow,
    dots: articles.length > effectiveSlidesToShow,
    swipe: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    dotsClass: "slick-dots !bottom-[-2rem]",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: articles.length > 1,
          dots: false, // 🔥 CAMBIAR A FALSE
        },
      },
    ],
  };

  return (
    <section className="relative w-full px-4 md:px-8 py-10 border-t border-gray-200 dark:border-gray-700">
      {title && <SectionHeader title={title} className="mb-8" />}

      <div className="pb-10">
        <Slider {...settings}>
          {articles.map((article) => {
            const firstImage =
              article.images?.[0] ||
              (article.articleImage
                ? {
                    url: article.articleImage.replace("public://", "/"),
                    alt: article.title,
                  }
                : null);
            const isES = locale === "es" && article.isTranslatedES;

            const articleTitle = isES ? article.titleES : article.title;
            const subtitle = isES ? article.subtitleES : article.subtitle;

            // 🔥 Preview text / Teaser
            const hasImage = firstImage?.url;
            // En mobile: menos texto. En desktop: más texto
            const isMobile =
              typeof window !== "undefined" && window.innerWidth < 1024;
            const previewLength = hasImage ? 200 : isMobile ? 200 : 800;

            let teaser = "";
            if (isES) {
              const fullText =
                stripHTML(article.previewTextES) ||
                stripHTML(article.contentES) ||
                "";
              teaser =
                fullText.length > previewLength
                  ? fullText.slice(0, previewLength) + "..."
                  : fullText;
            } else {
              const fullText =
                stripHTML(article.previewText) ||
                stripHTML(article.content) ||
                "";
              teaser =
                fullText.length > previewLength
                  ? fullText.slice(0, previewLength) + "..."
                  : fullText;
            }

            const editionYear = article.edition?.datePublished
              ? new Date(article.edition.datePublished).getFullYear()
              : article.publicationDate
                ? new Date(article.publicationDate).getFullYear()
                : null;

            return (
              <div
                key={article.id}
                className={`px-2 ${
                  articles.length === 1 ? "max-w-[400px] mx-auto" : ""
                }`}
              >
                <div className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 min-h-[450px] max-h-[550px] flex flex-col">
                  {/* Solo mostrar bloque de imagen si existe */}
                  {firstImage?.url ? (
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <ArticleLink article={article}>
                        <SmartImage
                          src={firstImage.url}
                          alt={firstImage.alt || "Artículo"}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          faceTopBias
                        />
                      </ArticleLink>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                      {/* Badges */}
                      <div className="absolute bottom-0 left-0 w-full px-3 py-2">
                        <EntityBadges
                          categories={article.categories}
                          regions={article.regions}
                          topics={article.topics}
                          context="articles"
                          disableLinks={true}
                        />
                      </div>

                      {/* Favorito */}
                      <div className="absolute top-2 right-2 z-20">
                        <FavoriteButton
                          articleId={article.id}
                          variant="compact"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Contenido */}
                  <div className="p-6 lg:p-4 relative flex-1 flex flex-col">
                    {/* Favorito para artículos sin imagen */}
                    {!firstImage?.url && (
                      <div className="absolute top-2 right-2 z-20">
                        <FavoriteButton
                          articleId={article.id}
                          variant="compact"
                        />
                      </div>
                    )}

                    {/* Badges para artículos sin imagen */}
                    {!firstImage?.url && (
                      <div className="mb-3">
                        <EntityBadges
                          categories={article.categories}
                          regions={article.regions}
                          topics={article.topics}
                          context="articles"
                          disableLinks={true}
                        />
                      </div>
                    )}
                    {/* Credit de imagen */}
                    {firstImage?.credit && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 truncate">
                        📷 {firstImage.credit}
                      </p>
                    )}

                    {/* Título */}
                    {/* Título */}
                    <h2
                      className={`font-bold font-serif leading-tight line-clamp-2 ${
                        firstImage?.url ? "text-lg" : "text-2xl"
                      }`}
                    >
                      <ArticleLink article={article}>
                        <span className="hover:text-red-600 transition-colors duration-200">
                          {articleTitle}
                        </span>
                      </ArticleLink>
                    </h2>

                    {/* Subtítulo */}
                    {subtitle && (
                      <p
                        className={`font-serif text-gray-500 dark:text-gray-400 mt-1 ${
                          firstImage?.url ? "text-sm" : "text-base"
                        }`}
                      >
                        {subtitle}
                      </p>
                    )}

                    {/* Teaser / Preview */}
                    {teaser && (
                      <p
                        className={`text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed overflow-hidden ${
                          firstImage?.url
                            ? "line-clamp-2"
                            : "line-clamp-4 lg:line-clamp-15"
                        }`}
                        style={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: firstImage?.url
                            ? 2
                            : isMobile
                              ? 4
                              : 15,
                        }}
                      >
                        {teaser}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-1">
                        {article.authors?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400">
                              {locale === "de" ? "von" : "por"}
                            </span>
                            {article.authors.map((author, i) => (
                              <span key={author.id}>
                                <LocaleLink
                                  href={`/authors/${author.id}`}
                                  className="text-red-600 hover:underline font-medium"
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
                          </div>
                        )}

                        {article.edition?.number && editionYear ? (
                          <span className="ml-auto bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {article.edition.number}/{editionYear}
                          </span>
                        ) : (
                          <span className="ml-auto bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide">
                            {locale === "de" ? "Nur online" : "Solo online"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>
    </section>
  );
}

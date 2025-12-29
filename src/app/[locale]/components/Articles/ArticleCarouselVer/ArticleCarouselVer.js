"use client";

import { useEffect, useState } from "react";
import Slider from "../../SafeSlick/SafeSlick";
import { PrevArrow, NextArrow } from "../CustomArrows/CustomArrows";
import SectionHeader from "../../SectionsHeader/SetionHeader";
import SmartImage from "../../SmartImage/SmartImage";
import ArticleLink from "../ArticleLink/ArticleLink";
import FavoriteButton from "../../FavoriteButton/FavoriteButton";
import EntityBadges from "../../EntityBadges/EntityBadges";
import HoverInfo from "../../HoverInfo/HoverInfo";
import { Link as LocaleLink } from "@/i18n/navigation";
import { useLocale } from "next-intl";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const stripHTML = (html) => {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export default function ArticleCarouselVer(props) {
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
  const effectiveSlidesToShow = slidesToShow || 4;

  const [articles, setArticles] = useState([]);
  const locale = useLocale();

  useEffect(() => {
    if (isManual && manualArticles) {
      const articleIds = manualArticles.map((a) => a.id).join(",");

      fetch(`/api/articles/batch?ids=${articleIds}`)
        .then((res) => res.json())
        .then((data) => {
          const orderedArticles = manualArticles
            .map((ma) => data.find((a) => a.id === ma.id))
            .filter(Boolean)
            // 🔥 Filtrar solo artículos CON imagen
            .filter((a) => (a.images && a.images.length > 0) || a.articleImage);

          setArticles(orderedArticles);
        })
        .catch(() => setArticles([]));

      return;
    }

    const params = new URLSearchParams();
    params.set("limit", effectiveLimit.toString());
    if (region) params.set("regionId", String(region));
    if (beitragstypId) params.set("beitragstypId", String(beitragstypId));
    params.set("locale", locale);

    fetch(`/api/articles/filtered?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        // 🔥 Filtrar solo artículos CON imagen
        const filtered = (data.articles || []).filter(
          (a) => (a.images && a.images.length > 0) || a.articleImage
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
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: articles.length > 2,
          dots: false,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: articles.length > 1,
          dots: false,
        },
      },
    ],
  };

  return (
    <section className="relative w-full px-4 md:px-8 py-6 md:py-8">
      {title && <SectionHeader title={title} className="mb-8" />}

      <div className="pb-6 md:pb-8">
        <Slider {...settings}>
          {articles.map((article) => {
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
            const articleTitle = isES ? article.titleES : article.title;
            const subtitle = isES ? article.subtitleES : article.subtitle;

            let teaser = "";
            if (isES) {
              teaser =
                stripHTML(article.previewTextES) ||
                stripHTML(article.contentES)?.slice(0, 150) ||
                "";
            } else {
              teaser =
                stripHTML(article.previewText) ||
                stripHTML(article.content)?.slice(0, 150) ||
                "";
            }

            const editionYear = article.edition?.datePublished
              ? new Date(article.edition.datePublished).getFullYear()
              : article.publicationDate
                ? new Date(article.publicationDate).getFullYear()
                : null;

            return (
              <div
                key={article.id}
                className={`px-2 focus:outline-none ${
                  articles.length === 1 ? "max-w-[260px] mx-auto" : ""
                }`}
              >
                <div className="group w-full max-w-[260px] mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  {/* Imagen VERTICAL - aspect ratio 2:3 */}
                  {hasImage && (
                    <div className="relative w-full aspect-[2/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <ArticleLink article={article}>
                        <SmartImage
                          src={primaryImage.url}
                          alt={primaryImage.alt || "Portada"}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </ArticleLink>

                      {/* Favorito */}
                      <div className="absolute top-2 right-2 z-20">
                        <FavoriteButton
                          articleId={article.id}
                          variant="compact"
                        />
                      </div>

                      {/* Badges */}
                      <div className="absolute bottom-0 left-0 w-full px-3 py-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                        <EntityBadges
                          categories={article.categories}
                          regions={article.regions}
                          topics={article.topics}
                          context="articles"
                          disableLinks={true}
                        />
                      </div>
                    </div>
                  )}

                  {/* Contenido */}
                  <div className="p-4">
                    {/* Badges si no hay imagen */}
                    {!hasImage && (
                      <div className="flex justify-between items-start mb-3">
                        <EntityBadges
                          categories={article.categories}
                          regions={article.regions}
                          topics={article.topics}
                          context="articles"
                          disableLinks={true}
                        />
                        <FavoriteButton
                          articleId={article.id}
                          variant="compact"
                        />
                      </div>
                    )}

                    {/* Título */}
                    <h3 className="text-lg font-bold font-serif leading-tight line-clamp-2 mb-1">
                      <ArticleLink article={article}>
                        <span className="hover:text-red-600 transition-colors duration-200">
                          {articleTitle}
                        </span>
                      </ArticleLink>
                    </h3>

                    {/* Subtítulo */}
                    {subtitle && (
                      <p className="text-sm font-serif text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                        {subtitle}
                      </p>
                    )}

                    {/* Teaser */}
                    {teaser && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                        {teaser}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                      {/* Autores */}
                      {article.authors?.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-2">
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

                      {/* Badge de edición */}
                      {article.edition?.number && editionYear ? (
                        <span className="inline-block bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-[10px] font-semibold">
                          {article.edition.number}/{editionYear}
                        </span>
                      ) : (
                        <span className="inline-block bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide">
                          {locale === "de" ? "Nur online" : "Solo online"}
                        </span>
                      )}
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

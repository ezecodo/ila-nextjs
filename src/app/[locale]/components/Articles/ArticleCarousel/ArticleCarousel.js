"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

export default function FilteredArticlesCarousel(props) {
  const { region, beitragstypId, title, limit, slidesToShow } = props;

  const effectiveLimit = limit || 30;
  const effectiveSlidesToShow = slidesToShow || 3;

  const [articles, setArticles] = useState([]);
  const locale = useLocale();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("limit", effectiveLimit.toString());
    if (region) params.set("regionId", String(region));
    if (beitragstypId) params.set("beitragstypId", String(beitragstypId));
    params.set("locale", locale);

    fetch(`/api/articles/filtered?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []));
  }, [region, beitragstypId, effectiveLimit, locale]);

  if (!articles || articles.length === 0) return null;

  const singleSlide = articles.length === 1;

  const settings = {
    infinite: articles.length > effectiveSlidesToShow,
    speed: 500,
    slidesToShow: singleSlide ? 1 : effectiveSlidesToShow,
    slidesToScroll: singleSlide ? 1 : effectiveSlidesToShow,
    arrows: articles.length > effectiveSlidesToShow,
    dots: articles.length > effectiveSlidesToShow,
    swipe: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
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
    <section className="relative w-full px-0 py-8 border-t border-gray-200 dark:border-gray-700">
      {title && (
        <SectionHeader title={title} className="mb-6 mx-4" /> // 👈 Reemplazar esto
      )}

      <Slider {...settings}>
        {articles.map((article) => {
          const firstImage = article.images?.[0];
          const articleTitle =
            locale === "es" && article.isTranslatedES
              ? article.titleES
              : article.title;
          const subtitle =
            locale === "es" && article.isTranslatedES
              ? article.subtitleES
              : article.subtitle;
          const editionYear = article.edition?.datePublished
            ? new Date(article.edition.datePublished).getFullYear()
            : article.publicationDate
              ? new Date(article.publicationDate).getFullYear()
              : null;

          return (
            <div
              key={article.id}
              className={`px-4 ${
                articles.length === 1 ? "max-w-[360px] mx-auto" : ""
              }`}
            >
              <div className="flex flex-col">
                <div className="relative w-full overflow-hidden rounded-md">
                  <ArticleLink article={article}>
                    {firstImage?.url && (
                      <Image
                        src={firstImage.url}
                        alt={firstImage.alt || "Artículo"}
                        width={800}
                        height={400}
                        className="w-full max-h-[240px] object-contain rounded-md bg-white"
                      />
                    )}
                  </ArticleLink>
                  <div className="absolute bottom-0 left-0 w-full px-2 py-1 bg-gradient-to-t from-white/80 via-white/60 to-transparent dark:from-black/70 dark:via-black/40 backdrop-blur-sm">
                    <EntityBadges
                      categories={article.categories}
                      regions={article.regions}
                      topics={article.topics}
                      context="articles"
                      disableLinks={true}
                    />
                  </div>
                </div>

                {firstImage?.credit && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {firstImage.credit}
                  </p>
                )}

                <h2 className="text-xl font-extrabold font-serif mt-4 leading-snug">
                  <ArticleLink article={article}>
                    <span className="hover:underline">{articleTitle}</span>
                  </ArticleLink>
                </h2>

                {subtitle && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                    {subtitle}
                  </p>
                )}

                <div className="flex justify-between items-start mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-1">
                    {/* Autor en minúscula y sin “:” */}
                    {article.authors?.length > 0 && (
                      <>
                        <span>{locale === "de" ? "von" : "por"}&nbsp;</span>
                        {article.authors.map((author, i) => (
                          <span key={author.id} className="flex gap-1">
                            <LocaleLink
                              href={`/authors/${author.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              <HoverInfo
                                id={author.id}
                                name={author.name}
                                entityType="authors"
                              />
                            </LocaleLink>
                            {i < article.authors.length - 1 && <span>,</span>}
                          </span>
                        ))}
                      </>
                    )}

                    {/* | Categorías */}
                    {article.categories?.length > 0 && (
                      <>
                        {article.authors?.length > 0 && (
                          <span className="opacity-60">|</span>
                        )}
                        <span>
                          {article.categories.map((cat, i) => (
                            <span key={cat.id}>
                              {locale === "es" && cat.nameES
                                ? cat.nameES
                                : cat.name}
                              {i < article.categories.length - 1 && ", "}
                            </span>
                          ))}
                        </span>
                      </>
                    )}

                    {/* | 488/2025 */}
                    {article.edition?.number && editionYear && (
                      <>
                        {(article.authors?.length > 0 ||
                          article.beitragstyp) && (
                          <span className="opacity-60">|</span>
                        )}
                        <span>
                          {article.edition.number}/{editionYear}
                        </span>
                      </>
                    )}
                  </div>

                  <FavoriteButton articleId={article.id} variant="compact" />
                </div>
              </div>
            </div>
          );
        })}
      </Slider>
    </section>
  );
}

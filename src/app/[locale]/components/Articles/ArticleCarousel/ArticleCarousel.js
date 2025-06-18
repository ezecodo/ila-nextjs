"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Slider from "../../SafeSlick/SafeSlick";
import { useLocale } from "next-intl";
import PreviewHover from "../../PreviewHover/PreviewHover";
import EntityBadges from "../../../components/EntityBadges/EntityBadges";
import FavoriteButton from "../../../components/FavoriteButton/FavoriteButton";
import HoverInfo from "../../../components/HoverInfo/HoverInfo";
import { Link as LocaleLink } from "@/i18n/navigation";
import { PrevArrow, NextArrow } from "../CustomArrows/CustomArrows";

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
    if (region) params.set("regionId", String(region)); // 👈 importante que sea regionId
    if (beitragstypId) params.set("beitragstypId", String(beitragstypId));
    params.set("locale", locale);

    fetch(`/api/articles/filtered?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []));
  }, [region, beitragstypId, effectiveLimit, locale]);

  if (!articles || articles.length === 0) return null;

  const isClient = typeof window !== "undefined";
  const singleSlide = articles.length === 1;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const showArrows = isMobile
    ? articles.length > 1
    : articles.length > effectiveSlidesToShow;

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
          arrows: articles.length > 1, // ✅ flechas en mobile si hay más de 1
          dots: false,
        },
      },
    ],
  };

  return (
    <section className="relative w-full px-0 py-8 border-t border-gray-200 dark:border-gray-700">
      {title && (
        <div className="bg-gradient-to-r from-red-50 to-white dark:from-gray-800 dark:to-gray-900 px-4 py-2 rounded mb-6 mx-4">
          <h2 className="text-2xl font-serif font-bold text-red-800 dark:text-red-300">
            {title}
          </h2>
        </div>
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
          const date = article.publicationDate
            ? new Date(article.publicationDate).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
              })
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
                  <Link href={`/articles/${article.id}`}>
                    {firstImage?.url && (
                      <Image
                        src={firstImage.url}
                        alt={firstImage.alt || "Artículo"}
                        width={800}
                        height={400}
                        className="w-full h-[240px] object-cover rounded-md"
                      />
                    )}
                  </Link>
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
                  <PreviewHover
                    preview={
                      locale === "es" && article.isTranslatedES
                        ? article.previewTextES || "—"
                        : article.previewText || "—"
                    }
                  >
                    <Link
                      href={`/articles/${article.id}`}
                      className="hover:underline"
                    >
                      {articleTitle}
                    </Link>
                  </PreviewHover>
                </h2>

                {subtitle && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                    {subtitle}
                  </p>
                )}

                <div className="flex justify-between items-start mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-1 items-center">
                    {date && <span>{date}</span>}

                    {article.beitragstyp && (
                      <>
                        <span className="opacity-60">|</span>
                        <span>
                          {locale === "es" && article.beitragstyp.nameES
                            ? article.beitragstyp.nameES
                            : article.beitragstyp.name}
                        </span>
                      </>
                    )}

                    {article.authors?.length > 0 && (
                      <>
                        <span className="opacity-60">|</span>
                        <span>by</span>
                        {article.authors.map((author) => (
                          <LocaleLink
                            key={author.id}
                            href={`/authors/${author.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            <HoverInfo
                              id={author.id}
                              name={author.name}
                              entityType="authors"
                            />
                          </LocaleLink>
                        ))}
                      </>
                    )}
                  </div>

                  <FavoriteButton articleId={article.id} />
                </div>
              </div>
            </div>
          );
        })}
      </Slider>
    </section>
  );
}

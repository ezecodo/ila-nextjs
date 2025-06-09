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

export default function ArticlesGrid() {
  const [articles, setArticles] = useState([]);
  const locale = useLocale();

  useEffect(() => {
    fetch(`/api/articles/list?limit=60&locale=${locale}`)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []));
  }, [locale]);

  const isClient = typeof window !== "undefined";

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    arrows: true,
    dots: true,
    swipe: true,
    swipeToSlide: true,
    ...(isClient && {
      prevArrow: <PrevArrow />,
      nextArrow: <NextArrow />,
    }),
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: true,
          dots: false,
        },
      },
    ],
  };

  return (
    <section className="relative w-full px-0 py-8 border-t border-gray-200">
      <Slider {...settings}>
        {articles.map((article) => {
          const firstImage = article.images?.[0];
          const title =
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
            <div key={article.id} className="px-4">
              <div className="flex flex-col">
                {/* Imagen */}
                <div className="relative w-full overflow-hidden rounded-md">
                  <Link href={`/articles/${article.id}`}>
                    {firstImage?.url ? (
                      <Image
                        src={firstImage.url}
                        alt={firstImage.alt || "Artículo"}
                        width={800}
                        height={400}
                        className="w-full h-[240px] object-cover rounded-md"
                      />
                    ) : null}
                  </Link>
                  <div className="absolute bottom-0 left-0 w-full px-2 py-1 bg-gradient-to-t from-white/80 via-white/60 to-transparent backdrop-blur-sm">
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
                  <p className="text-xs text-gray-400 mt-1">
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
                      {title}
                    </Link>
                  </PreviewHover>
                </h2>

                {subtitle && (
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {subtitle}
                  </p>
                )}

                <div className="flex justify-between items-start mt-2">
                  <div className="text-xs text-gray-500 flex flex-wrap gap-x-1 items-center">
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

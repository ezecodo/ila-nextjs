"use client";

import { useState, useEffect, useRef } from "react";

import Image from "next/image";
import Link from "next/link";
import DonationBanner from "../DonationBanner/DonationBanner";
import Events from "../Events/Events";
import EntityBadges from "../EntityBadges/EntityBadges";
import MiniArticleCardGrid from "../Articles/MiniArticleCardGrid";
import { useTranslations, useLocale } from "next-intl";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";
import Slider from "../SafeSlick/SafeSlick";
import { useRouter, useSearchParams } from "next/navigation";
import IlaLoader from "../../components/IlaLoader/IlaLoader";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function LatestEditionWithArticles() {
  const [editions, setEditions] = useState([]);
  const [currentEditionIndex, setCurrentEditionIndex] = useState(0);
  const [articles, setArticles] = useState([]);
  const [editionsCount, setEditionsCount] = useState({});

  const [pickerValue, setPickerValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const listRef = useRef(null);

  const locale = useLocale();
  const t = useTranslations("dossiers");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  const currentEdition = editions[currentEditionIndex];

  // ✅ Función helper para actualizar la URL
  const updateEditionInURL = (index) => {
    if (editions[index]) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("edition", editions[index].number);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };

  useEffect(() => {
    async function fetchAllEditions() {
      try {
        console.time("LatestEdition1:editions");
        const res = await fetch("/api/editions?sort=desc");
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`API /api/editions fallo: ${res.status} ${msg}`);
        }
        const raw = await res.json();
        const data = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.editions)
            ? raw.editions
            : [];
        const byNumberDesc = [...data].sort(
          (a, b) => (b?.number ?? -Infinity) - (a?.number ?? -Infinity)
        );
        setEditions(byNumberDesc);

        // ✅ Restaurar el índice desde la URL
        const editionParam = searchParams.get("edition");
        if (editionParam && byNumberDesc.length) {
          const savedIndex = byNumberDesc.findIndex(
            (e) => String(e.number) === editionParam
          );
          setCurrentEditionIndex(savedIndex >= 0 ? savedIndex : 0);
        } else if (byNumberDesc.length) {
          setCurrentEditionIndex(0);
        }

        console.timeEnd("LatestEdition1:editions");
      } catch (e) {
        console.error("Error cargando ediciones:", e);
        setEditions([]);
      }
    }
    fetchAllEditions();
  }, []); // Solo depende del montaje inicial

  useEffect(() => {
    const ed = editions[currentEditionIndex];
    if (!ed) return;

    fetchArticles(ed.id);

    const id = setTimeout(() => fetchEditionsCount(ed), 0);
    return () => clearTimeout(id);
  }, [currentEditionIndex, editions]);

  async function fetchArticles(editionId) {
    const res = await fetch(
      `/api/articles/list?editionId=${editionId}&limit=200`
    );
    const data = await res.json();
    setArticles(data.articles || []);
  }

  async function fetchEditionsCount(edition) {
    if (!edition) return;

    console.time("LatestEdition1:counts");

    const [regions, topics] = await Promise.all([
      Promise.all(
        (edition.regions || []).map(async (region) => {
          const res = await fetch(
            `/api/count/regions/${region.id}?context=editions`
          );
          const data = await res.json();
          return { id: region.id, count: data.count };
        })
      ),
      Promise.all(
        (edition.topics || []).map(async (topic) => {
          const res = await fetch(
            `/api/count/topics/${topic.id}?context=editions`
          );
          const data = await res.json();
          return { id: topic.id, count: data.count };
        })
      ),
    ]);

    setEditionsCount({
      regions: Object.fromEntries(regions.map(({ id, count }) => [id, count])),
      topics: Object.fromEntries(topics.map(({ id, count }) => [id, count])),
    });

    console.timeEnd("LatestEdition1:counts");
  }

  let filteredArticles = [];

  // 🌍 Filtrado base según idioma
  if (locale === "es") {
    filteredArticles = articles.filter(
      (a) => a.isTranslatedES && !a.needsReviewES
    );
  } else {
    filteredArticles = articles;
  }

  // 💻 Versión desktop → limitar a 10 artículos
  const desktopArticles = filteredArticles.slice(0, 10);

  // 📱 Versión mobile → sin límite
  const mobileArticles = filteredArticles;

  const isVertical = (img) =>
    img?.width && img?.height && Number(img.height) > Number(img.width);

  const firstImg = (a) => a?.images?.[0] || a?.image || null;

  const horizontalArticles = filteredArticles.filter(
    (a) => firstImg(a) && !isVertical(firstImg(a))
  );
  const verticalArticles = filteredArticles.filter(
    (a) => firstImg(a) && isVertical(firstImg(a))
  );
  const withoutImage = filteredArticles.filter((a) => !firstImg(a));

  const orderedArticles = [
    ...horizontalArticles,
    ...verticalArticles,
    ...withoutImage,
  ];

  const mobileCarouselSettings = {
    infinite: orderedArticles.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: orderedArticles.length > 1,
    dots: true,
    swipe: true,
    swipeToSlide: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  const focusInputSoon = () => setTimeout(() => inputRef.current?.focus(), 0);

  useEffect(() => {
    if (!showNumberPicker) return;
    const onClick = (e) => {
      if (!popoverRef.current) return;
      if (!popoverRef.current.contains(e.target)) setShowNumberPicker(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showNumberPicker]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-0 sm:px-6 pb-16">
        {currentEdition && (
          <div className="flex flex-col lg:flex-row gap-2 items-start">
            <div className="relative w-full lg:w-1/3 flex items-start justify-center">
              <div className="bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-800 p-2 pt-0 flex flex-col gap-4 items-center w-full max-w-sm">
                <div className="relative w-full">
                  <div className="flex items-center justify-center">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                      {currentEditionIndex < editions.length - 1 && (
                        <PrevArrow
                          onClick={() => {
                            const newIndex = currentEditionIndex + 1;
                            setCurrentEditionIndex(newIndex);
                            updateEditionInURL(newIndex); // ✅ Actualizar URL
                          }}
                        />
                      )}
                    </div>

                    <div className="text-center mx-10 flex flex-col items-center space-y-1">
                      <div className="flex items-baseline justify-center gap-3 leading-none relative">
                        <button
                          type="button"
                          className="ila-edition font-bold text-[1.75rem] md:text-[2rem] leading-none hover:text-red-700"
                          title="Cambiar dossier (Enter para ir)"
                          onClick={() => {
                            setShowNumberPicker((v) => !v);
                            setPickerValue(String(currentEdition.number ?? ""));
                            const idx = editions.findIndex(
                              (e) => e.id === currentEdition.id
                            );
                            setHighlightedIndex(idx >= 0 ? idx : null);
                            focusInputSoon();
                          }}
                        >
                          ila {currentEdition.number}
                        </button>

                        {currentEdition.datePublished && (
                          <span className="font-bold text-xs md:text-sm text-black dark:text-gray-300 leading-none">
                            {new Date(currentEdition.datePublished)
                              .toLocaleDateString(
                                locale === "es" ? "es-ES" : "de-DE",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                              .replace(".", "")
                              .replace(/^\w/, (c) => c.toUpperCase())}
                          </span>
                        )}

                        {showNumberPicker && (
                          <div
                            ref={popoverRef}
                            className="absolute z-30 top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-56 p-2"
                          >
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {t("pickerLabel")}
                            </label>
                            <input
                              ref={inputRef}
                              type="number"
                              value={pickerValue}
                              className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500"
                              placeholder={t("pickerPlaceholder")}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPickerValue(val);

                                if (!val) {
                                  setHighlightedIndex(null);
                                  return;
                                }
                                const idx = editions.findIndex((ed) =>
                                  String(ed.number ?? "").startsWith(val)
                                );
                                setHighlightedIndex(idx >= 0 ? idx : null);

                                if (idx >= 0) {
                                  const el = listRef.current?.querySelector(
                                    `[data-idx="${idx}"]`
                                  );
                                  el?.scrollIntoView({ block: "nearest" });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  let targetIdx = highlightedIndex;
                                  if (targetIdx == null && pickerValue) {
                                    targetIdx = editions.findIndex(
                                      (ed) =>
                                        Number(ed.number) ===
                                        Number(pickerValue)
                                    );
                                  }
                                  if (targetIdx != null && targetIdx >= 0) {
                                    setCurrentEditionIndex(targetIdx);
                                    updateEditionInURL(targetIdx); // ✅ Actualizar URL
                                    router.push(
                                      `/editions/${editions[targetIdx].id}`
                                    );
                                    setShowNumberPicker(false);
                                  }
                                } else if (e.key === "ArrowDown") {
                                  e.preventDefault();
                                  setHighlightedIndex((i) => {
                                    const next = Math.min(
                                      (i ?? -1) + 1,
                                      editions.length - 1
                                    );
                                    const el = listRef.current?.querySelector(
                                      `[data-idx="${next}"]`
                                    );
                                    el?.scrollIntoView({ block: "nearest" });
                                    return next;
                                  });
                                } else if (e.key === "ArrowUp") {
                                  e.preventDefault();
                                  setHighlightedIndex((i) => {
                                    const next = Math.max(
                                      (i ?? editions.length) - 1,
                                      0
                                    );
                                    const el = listRef.current?.querySelector(
                                      `[data-idx="${next}"]`
                                    );
                                    el?.scrollIntoView({ block: "nearest" });
                                    return next;
                                  });
                                } else if (e.key === "Escape") {
                                  setShowNumberPicker(false);
                                }
                              }}
                            />

                            <div
                              ref={listRef}
                              className="mt-2 max-h-48 overflow-auto border-t pt-2"
                            >
                              {editions.map((ed, idx) => {
                                const isActive = idx === currentEditionIndex;
                                const isHighlighted = idx === highlightedIndex;

                                return (
                                  <button
                                    key={ed.id}
                                    type="button"
                                    data-idx={idx}
                                    className={[
                                      "w-full text-left px-2 py-1 rounded text-sm",
                                      "hover:bg-red-50 dark:hover:bg-gray-700",
                                      isHighlighted
                                        ? "bg-red-200 dark:bg-gray-600 ring-1 ring-red-400 dark:ring-gray-500"
                                        : "",
                                      !isHighlighted && isActive
                                        ? "bg-red-100/60 dark:bg-gray-700"
                                        : "",
                                    ].join(" ")}
                                    onClick={() => {
                                      setCurrentEditionIndex(idx);
                                      updateEditionInURL(idx); // ✅ Actualizar URL
                                      setShowNumberPicker(false);
                                    }}
                                    title={
                                      (locale === "es" && ed.titleES
                                        ? ed.titleES
                                        : ed.title) || undefined
                                    }
                                  >
                                    ila {ed.number} —{" "}
                                    {locale === "es" && ed.titleES
                                      ? ed.titleES
                                      : ed.title}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                                onClick={() => setShowNumberPicker(false)}
                              >
                                {t("close")}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="font-serif font-bold text-red-800 dark:text-red-400 text-xl md:text-2xl leading-snug">
                        {locale === "es" && currentEdition.titleES
                          ? currentEdition.titleES
                          : currentEdition.title}
                      </div>
                    </div>

                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      {currentEditionIndex > 0 && (
                        <NextArrow
                          onClick={() => {
                            const newIndex = currentEditionIndex - 1;
                            setCurrentEditionIndex(newIndex);
                            updateEditionInURL(newIndex); // ✅ Actualizar URL
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/editions/${currentEdition.id}`}
                  className="relative w-full cursor-pointer block group"
                >
                  <Image
                    src={currentEdition.coverImage}
                    alt={`Portada de ${currentEdition.title}`}
                    width={300}
                    height={400}
                    className="shadow-md dark:shadow-gray-800 object-cover w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
                    priority
                  />
                </Link>

                <EntityBadges
                  regions={currentEdition.regions.map((region) => ({
                    ...region,
                    count: editionsCount.regions?.[region.id] || 0,
                  }))}
                  topics={currentEdition.topics.map((topic) => ({
                    ...topic,
                    count: editionsCount.topics?.[topic.id] || 0,
                  }))}
                  entityType="editions"
                  context="editions"
                  locale={locale}
                />

                <Link
                  href={`/editions/${currentEdition.id}`}
                  className="bg-white text-red-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition border border-red-600"
                >
                  {t("editorialButton")}
                </Link>

                <div className="hidden lg:flex flex-col gap-4 w-full">
                  <DonationBanner />
                  <Events />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-2/3 flex flex-col gap-6">
              {/* Desktop */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
                {desktopArticles.length > 0 ? (
                  desktopArticles.map((article) => (
                    <MiniArticleCardGrid key={article.id} article={article} />
                  ))
                ) : (
                  <div className="flex items-center justify-center col-span-full h-[400px]">
                    <IlaLoader />
                  </div>
                )}
              </div>

              {/* ✅ Carrusel móvil corregido */}
              {/* Mobile */}
              <div className="block lg:hidden w-full mt-0">
                {mobileArticles.length > 0 ? (
                  <Slider {...mobileCarouselSettings}>
                    {mobileArticles.map((article) => (
                      <div key={article.id} className="w-full">
                        <MiniArticleCardGrid article={article} />
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 border-l-4 border-red-500 rounded-r-lg shadow-md my-6 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-red-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-gray-800 dark:text-gray-200 font-bold text-lg mb-2">
                            {t("noArticlesInEdition")}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <svg
                              className="w-5 h-5 animate-spin text-red-500"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <p className="text-sm">{t("translatorsWorking")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 px-6 py-3 border-t border-red-100 dark:border-red-900/30">
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {t("checkBackSoon")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="block lg:hidden w-full mt-6 space-y-4">
                <DonationBanner />
                <Events />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

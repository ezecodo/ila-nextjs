"use client";

import { useState, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import Image from "next/image";
import Link from "next/link";
import DonationBanner from "../DonationBanner/DonationBanner";
import Events from "../Events/Events";
import AktuellesPreview from "../AktuellesPreview/AktuellesPreview";
import EntityBadges from "../EntityBadges/EntityBadges";
import MiniArticleCardGrid from "../Articles/MiniArticleCardGrid";
import { useTranslations, useLocale } from "next-intl";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";
import Slider from "../SafeSlick/SafeSlick";
import { useRouter, useSearchParams } from "next/navigation";
import SideBanner50 from "../Banners/Side50Banner/Side50Banner";
import PartyBanner from "../Banners/PartyBanner/PartyBanner";

import NoArticlesAvailable from "../../components/NoArticlesAvailable/NoArticlesAvailable";
import IlaLoader from "../IlaLoader/IlaLoader";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function LatestEditionWithArticles() {
  const [editions, setEditions] = useState([]);
  const [currentEditionIndex, setCurrentEditionIndex] = useState(0);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const toggleButtonRef = useRef(null);

  const currentEdition = editions[currentEditionIndex];
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoverBlocked, setHoverBlocked] = useState(false);
  const [coverHover, setCoverHover] = useState(false);
  const [desktopVisible, setDesktopVisible] = useState(8);
  const [baseFill, setBaseFill] = useState(8);
  const articlesSectionRef = useRef(null);
  const leftColRef = useRef(null);
  const autoFillDoneRef = useRef(false);
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  // ✅ Función helper para actualizar la URL
  const updateEditionInURL = (index) => {
    if (editions[index]) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("edition", editions[index].number);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  };
  // ✅ Función para cambiar de edición con animación
  const changeEdition = (newIndex) => {
    if (newIndex < 0 || newIndex >= editions.length) return;
    if (isTransitioning) return;

    setIsTransitioning(true);
    setHoverBlocked(true);
    setDesktopVisible(8);
    setCurrentEditionIndex(newIndex);
    updateEditionInURL(newIndex);

    setTimeout(() => setIsTransitioning(false), 800);
  };
  useEffect(() => {
    if (!localStorage.getItem("ila_mobile_swiped")) {
      setShowSwipeHint(true);
    }
  }, []);

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
          (a, b) => (b?.number ?? -Infinity) - (a?.number ?? -Infinity),
        );
        setEditions(byNumberDesc);

        // ✅ Restaurar el índice desde la URL
        const editionParam = searchParams.get("edition");
        if (editionParam && byNumberDesc.length) {
          const savedIndex = byNumberDesc.findIndex(
            (e) => String(e.number) === editionParam,
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
    setMobileSlideIndex(0);

    const id = setTimeout(() => fetchEditionsCount(ed), 0);
    return () => clearTimeout(id);
  }, [currentEditionIndex, editions]);

  async function fetchArticles(editionId) {
    setLoading(true);
    const res = await fetch(
      `/api/articles/list?editionId=${editionId}&limit=200`,
    );
    const data = await res.json();
    setArticles(data.articles || []);
    setLoading(false);
  }

  async function fetchEditionsCount(edition) {
    if (!edition) return;

    console.time("LatestEdition1:counts");

    const [regions, topics] = await Promise.all([
      Promise.all(
        (edition.regions || []).map(async (region) => {
          const res = await fetch(
            `/api/count/regions/${region.id}?context=editions`,
          );
          const data = await res.json();
          return { id: region.id, count: data.count };
        }),
      ),
      Promise.all(
        (edition.topics || []).map(async (topic) => {
          const res = await fetch(
            `/api/count/topics/${topic.id}?context=editions`,
          );
          const data = await res.json();
          return { id: topic.id, count: data.count };
        }),
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
      (a) => a.isTranslatedES && !a.needsReviewES,
    );
  } else {
    filteredArticles = articles;
  }

  // 🖼️ Solo artículos con imagen válida
  const articlesWithImages = filteredArticles.filter((a) => {
    const img = a?.images?.[0] || a?.image;
    return img && img.url;
  });

  // 💻 Desktop → grid con "cargar más" (lotes de 8)
  const desktopArticles = articlesWithImages.slice(0, desktopVisible);

  const handleCollapseDesktop = () => {
    setDesktopVisible(baseFill);
    requestAnimationFrame(() => {
      articlesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // 🔄 Reset del auto-relleno al cambiar de edición/idioma o al recargar artículos
  useEffect(() => {
    autoFillDoneRef.current = false;
    setDesktopVisible(8);
    setBaseFill(8);
  }, [currentEditionIndex, locale, loading]);

  // 📏 Auto-rellenar el grid (de a una fila de 3) hasta igualar la altura
  // de la columna izquierda (que termina en el banner de la fiesta).
  useEffect(() => {
    if (loading) return;
    if (autoFillDoneRef.current) return;
    if (typeof window === "undefined" || window.innerWidth < 1024) return;

    const left = leftColRef.current;
    const right = articlesSectionRef.current;
    if (!left || !right) return;

    const total = articlesWithImages.length;

    // Ya se muestran todos, o el grid ya alcanzó/superó la izquierda → fijar base
    if (
      desktopArticles.length >= total ||
      right.offsetHeight >= left.offsetHeight
    ) {
      autoFillDoneRef.current = true;
      setBaseFill(desktopArticles.length);
      return;
    }

    // Falta altura → cargar una fila más
    setDesktopVisible((v) => Math.min(v + 3, total));
  }, [loading, desktopVisible, articlesWithImages.length, currentEditionIndex, locale]);

  const isVertical = (img) =>
    img?.width && img?.height && Number(img.height) > Number(img.width);

  const firstImg = (a) => a?.images?.[0] || a?.image || null;

  const horizontalArticles = filteredArticles.filter(
    (a) => firstImg(a) && !isVertical(firstImg(a)),
  );
  const verticalArticles = filteredArticles.filter(
    (a) => firstImg(a) && isVertical(firstImg(a)),
  );
  const withoutImage = filteredArticles.filter((a) => !firstImg(a));

  const orderedArticles = [
    ...horizontalArticles,
    ...verticalArticles,
    ...withoutImage,
  ];

  // 📱 Mobile → artículos con imagen primero, sin imagen al final
  const mobileArticles = orderedArticles;

  const mobileCarouselSettings = {
    infinite: orderedArticles.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: false,
    swipe: true,
    swipeToSlide: true,
    adaptiveHeight: true,
    afterChange: (idx) => {
      setMobileSlideIndex(idx);
      setShowSwipeHint(false);
      localStorage.setItem("ila_mobile_swiped", "1");
    },
  };

  const focusInputSoon = () => setTimeout(() => inputRef.current?.focus(), 0);

  useEffect(() => {
    if (!showNumberPicker) return;
    const onClick = (e) => {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(e.target)) return;
      if (toggleButtonRef.current?.contains(e.target)) return;
      setShowNumberPicker(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showNumberPicker]);
  useEffect(() => {
    const editionParam = searchParams.get("edition");

    // Si hay edition → respétala
    if (editionParam && editions.length) {
      const savedIndex = editions.findIndex(
        (e) => String(e.number) === editionParam,
      );
      setCurrentEditionIndex(savedIndex >= 0 ? savedIndex : 0);
      return;
    }

    // 🔥 Solo resetear si estamos realmente en Home
    if (!editionParam && editions.length) {
      const path = window.location.pathname;
      if (path === "/" || path.endsWith("/de") || path.endsWith("/es")) {
        setCurrentEditionIndex(0);
      }
    }
  }, [searchParams, editions]);
  // ✅ Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && currentEditionIndex > 0) {
        e.preventDefault();
        changeEdition(currentEditionIndex - 1);
      } else if (
        e.key === "ArrowRight" &&
        currentEditionIndex < editions.length - 1
      ) {
        e.preventDefault();
        changeEdition(currentEditionIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentEditionIndex, editions.length, isTransitioning]);

  // ✅ Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentEditionIndex > 0) {
        changeEdition(currentEditionIndex - 1);
      }
    },
    onSwipedRight: () => {
      if (currentEditionIndex < editions.length - 1) {
        changeEdition(currentEditionIndex + 1);
      }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });
  return (
    <>
      <div className="w-full max-w-[1800px] mx-auto px-0 sm:px-6 lg:px-4 pb-16">
        {currentEdition && (
          <div className="flex flex-col lg:flex-row gap-1 lg:gap-1 items-start justify-between">
            <div
              ref={leftColRef}
              className="relative w-full lg:w-auto flex items-start justify-end"
            >
              <div className="bg-white dark:bg-gray-900 lg:shadow-lg lg:dark:shadow-gray-800 p-2 pt-0 flex flex-col gap-4 items-center w-full max-w-sm lg:max-w-md">
                <div className="relative w-full order-1 lg:order-1">
                  <div className="text-center flex flex-col items-center space-y-1">
                    <div className="flex items-baseline justify-center gap-3 leading-none relative">
                      <button
                        type="button"
                        className="ila-edition font-bold text-[1.75rem] md:text-[2rem] leading-none hover:text-[#BD0E0D]"
                        title="Cambiar dossier (Enter para ir)"
                        onClick={() => {
                          setShowNumberPicker((v) => !v);
                          setPickerValue(String(currentEdition.number ?? ""));
                          const idx = editions.findIndex(
                            (e) => e.id === currentEdition.id,
                          );
                          setHighlightedIndex(idx >= 0 ? idx : null);
                          focusInputSoon();
                        }}
                      >
                        ila {currentEdition.number}
                      </button>
                      {/* Indicador dropdown elegante - también clickable */}
                      <button
                        ref={toggleButtonRef}
                        type="button"
                        onClick={() => {
                          setShowNumberPicker((v) => !v);
                          setPickerValue(String(currentEdition.number ?? ""));
                          const idx = editions.findIndex(
                            (e) => e.id === currentEdition.id,
                          );
                          setHighlightedIndex(idx >= 0 ? idx : null);
                          focusInputSoon();
                        }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#BD0E0D]/10 dark:bg-[#BD0E0D]/30 hover:bg-[#BD0E0D]/20"
                        title="Seleccionar edición"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`text-red-600 transition-transform duration-200 ${
                            showNumberPicker ? "rotate-180" : ""
                          }`}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>

                      {currentEdition.datePublished && (
                        <span className="font-bold text-xs md:text-sm text-black dark:text-gray-300 leading-none">
                          {new Date(currentEdition.datePublished)
                            .toLocaleDateString(
                              locale === "es" ? "es-ES" : "de-DE",
                              {
                                month: "short",
                                year: "numeric",
                              },
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
                            className="w-full border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#BD0E0D]"
                            placeholder={t("pickerPlaceholder")}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPickerValue(val);

                              if (!val) {
                                setHighlightedIndex(null);
                                return;
                              }
                              const idx = editions.findIndex((ed) =>
                                String(ed.number ?? "").startsWith(val),
                              );
                              setHighlightedIndex(idx >= 0 ? idx : null);

                              if (idx >= 0) {
                                const el = listRef.current?.querySelector(
                                  `[data-idx="${idx}"]`,
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
                                      Number(ed.number) === Number(pickerValue),
                                  );
                                }
                                if (targetIdx != null && targetIdx >= 0) {
                                  changeEdition(targetIdx);
                                  router.push(
                                    `/editions/${editions[targetIdx].id}`,
                                  );
                                  setShowNumberPicker(false);
                                }
                              } else if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setHighlightedIndex((i) => {
                                  const next = Math.min(
                                    (i ?? -1) + 1,
                                    editions.length - 1,
                                  );
                                  const el = listRef.current?.querySelector(
                                    `[data-idx="${next}"]`,
                                  );
                                  el?.scrollIntoView({ block: "nearest" });
                                  return next;
                                });
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setHighlightedIndex((i) => {
                                  const next = Math.max(
                                    (i ?? editions.length) - 1,
                                    0,
                                  );
                                  const el = listRef.current?.querySelector(
                                    `[data-idx="${next}"]`,
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
                                      ? "bg-[#BD0E0D]/20 dark:bg-gray-600 ring-1 ring-[#BD0E0D]/40 dark:ring-gray-500"
                                      : "",
                                    !isHighlighted && isActive
                                      ? "bg-[#BD0E0D]/10 dark:bg-gray-700"
                                      : "",
                                  ].join(" ")}
                                  onClick={() => {
                                    changeEdition(idx);
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

                    <div className="font-futura font-bold text-[#BD0E0D] dark:text-[#BD0E0D]/80 text-2xl md:text-3xl leading-tight">
                      {locale === "es" && currentEdition.titleES
                        ? currentEdition.titleES
                        : currentEdition.title}
                    </div>
                  </div>
                </div>

                <div
                  {...swipeHandlers}
                  className="relative w-full h-auto flex items-start justify-center pt-0 order-2 lg:order-2"
                  style={{ minHeight: "320px" }}
                  onMouseLeave={() => setHoverBlocked(false)}
                >
                  {/* Portada anterior (izquierda) */}
                  {currentEditionIndex < editions.length - 1 && (
                    <div
                      onClick={() => changeEdition(currentEditionIndex + 1)}
                      className={`absolute left-0 top-1/2 z-10 cursor-pointer transition-all duration-300 animate-[float-left_3s_ease-in-out_infinite] ${isTransitioning || hoverBlocked ? "pointer-events-none opacity-60" : "opacity-60 hover:opacity-100 hover:z-30 hover:scale-110 hover:shadow-2xl group"}`}
                      style={{
                        transform: "translateY(-50%) rotate(-5deg)",
                        transformOrigin: "center",
                        width: "120px",
                      }}
                    >
                      <Image
                        src={editions[currentEditionIndex + 1].coverImage}
                        alt={`ila ${editions[currentEditionIndex + 1].number}`}
                        width={140}
                        height={187}
                        className="shadow-lg object-cover w-full h-auto"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded">
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg
                            className="w-6 h-6 text-[#BD0E0D] animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#BD0E0D] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        ila {editions[currentEditionIndex + 1].number}
                      </div>
                    </div>
                  )}

                  {/* Portada central (actual) */}
                  <div
                    key={currentEdition.id}
                    className={`relative z-20 mx-auto transition-all duration-600 ease-in-out max-w-[240px] lg:max-w-[280px] ${
                      isTransitioning
                        ? "opacity-0 scale-95"
                        : "opacity-100 scale-100"
                    }`}
                  >
                    <Link
                      href={`/${locale}/editions/${currentEdition.id}`}
                      className="relative w-full cursor-pointer block"
                      onMouseEnter={() => setCoverHover(true)}
                      onMouseLeave={() => setCoverHover(false)}
                    >
                      <div className="border-x-[5px] border-t-[5px] border-white">

                        <Image
                          src={currentEdition.coverImage}
                          alt={`Portada de ${currentEdition.title}`}
                          width={360}
                          height={480}
                          className={`block object-cover w-full h-auto transition-transform duration-300 ${
                            coverHover ? "scale-[1.02]" : ""
                          }`}
                          priority
                        />
                      </div>
                    </Link>
                  </div>

                  {/* Portada siguiente (derecha) */}
                  {currentEditionIndex > 0 && (
                    <div
                      onClick={() => changeEdition(currentEditionIndex - 1)}
                      className={`absolute right-0 top-1/2 z-10 cursor-pointer transition-all duration-300 animate-[float-right_3s_ease-in-out_infinite] ${isTransitioning || hoverBlocked ? "pointer-events-none opacity-60" : "opacity-60 hover:opacity-100 hover:z-30 hover:scale-110 hover:shadow-2xl group"}`}
                      style={{
                        transform: "translateY(-50%) rotate(5deg)",
                        transformOrigin: "center",
                        width: "120px",
                      }}
                    >
                      <Image
                        src={editions[currentEditionIndex - 1].coverImage}
                        alt={`ila ${editions[currentEditionIndex - 1].number}`}
                        width={140}
                        height={187}
                        className="shadow-lg object-cover w-full h-auto"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded">
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <svg
                            className="w-6 h-6 text-[#BD0E0D] animate-pulse"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#BD0E0D] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                        ila {editions[currentEditionIndex - 1].number}
                      </div>
                    </div>
                  )}

                </div>

                {(currentEdition.regions?.length > 0 ||
                  currentEdition.topics?.length > 0) && (
                  <div className="order-4 w-full max-w-[280px] mx-auto">
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
                  </div>
                )}

                <Link
                  href={`/${locale}/editions/${currentEdition.id}`}
                  onMouseEnter={() => setCoverHover(true)}
                  onMouseLeave={() => setCoverHover(false)}
                  className={`relative z-10 order-3 w-full max-w-[230px] lg:max-w-[270px] mx-auto -mt-5 flex items-center justify-center gap-2 bg-[#BD0E0D] text-white font-bold px-6 py-3 transition-all duration-300 origin-top ${
                    coverHover ? "scale-[1.02]" : ""
                  }`}
                >
                  {t("editorialButton")}
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="hidden lg:flex flex-col gap-4 w-full order-5">
                  <AktuellesPreview />
                  <Events />
                  <SideBanner50 />
                  <PartyBanner />
                </div>
              </div>
            </div>

            <div
              ref={articlesSectionRef}
              className="w-full lg:flex-1 flex flex-col gap-6 mt-8 lg:mt-0 scroll-mt-[120px]"
            >

              {/* Articles section header */}
              {!loading && filteredArticles.length > 0 && (
                <div className="hidden lg:flex items-baseline justify-between">
                  <div>
                    <h2 className="font-bold text-lg dark:text-gray-100 leading-tight">
                      {locale === "de"
                        ? "Beiträge in dieser Ausgabe"
                        : "Artículos en este número"}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {filteredArticles.length}{" "}
                      {locale === "de"
                        ? filteredArticles.length === 1
                          ? "Beitrag"
                          : "Beiträge"
                        : filteredArticles.length === 1
                          ? "artículo"
                          : "artículos"}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/editions/${currentEdition.id}`}
                    className="flex items-center gap-1 text-[#BD0E0D] font-semibold text-sm hover:underline shrink-0 ml-4"
                  >
                    {locale === "de" ? "Alle ansehen" : "Ver todos"}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* Desktop */}
              {/* Desktop */}
              <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-4">
                {loading ? (
                  <div className="col-span-full flex items-center justify-center min-h-[400px]">
                    <IlaLoader />
                  </div>
                ) : desktopArticles.length > 0 ? (
                  desktopArticles.map((article, idx) => (
                    <MiniArticleCardGrid
                      key={article.id}
                      article={article}
                      delay={idx * 200}
                      isTransitioning={isTransitioning}
                    />
                  ))
                ) : locale === "es" ? (
                  <NoArticlesAvailable edition={currentEdition} />
                ) : (
                  <div className="col-span-full flex items-center justify-center min-h-[400px]">
                    <IlaLoader />
                  </div>
                )}
              </div>

              {/* Cargar más / Mostrar menos (solo desktop) */}
              {!loading && articlesWithImages.length > baseFill && (
                <div className="hidden lg:flex justify-center">
                  {desktopArticles.length < articlesWithImages.length ? (
                    <button
                      type="button"
                      onClick={() => setDesktopVisible((v) => v + 8)}
                      className="flex items-center gap-2 px-6 py-3 border border-[#BD0E0D] text-[#BD0E0D] font-bold hover:bg-[#BD0E0D] hover:text-white transition-colors"
                    >
                      {locale === "de" ? "Mehr laden" : "Cargar más"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCollapseDesktop}
                      className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:border-[#BD0E0D] hover:text-[#BD0E0D] transition-colors"
                    >
                      {locale === "de" ? "Weniger anzeigen" : "Mostrar menos"}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Mobile */}
              {/* Mobile */}
              <div className="block lg:hidden w-full mt-0">
                {mobileArticles.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {locale === "de" ? "Beiträge" : "Artículos"}
                      </span>
                      <span className="text-xs font-bold text-[#BD0E0D] tabular-nums">
                        {mobileSlideIndex + 1} / {mobileArticles.length}
                      </span>
                    </div>
                    <div className="relative">
                      <Slider {...mobileCarouselSettings}>
                        {mobileArticles.map((article) => (
                          <div key={article.id} className="w-full">
                            <MiniArticleCardGrid
                              article={article}
                              isTransitioning={isTransitioning}
                            />
                          </div>
                        ))}
                      </Slider>

                      {showSwipeHint && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center gap-1 animate-pulse">
                          <div style={{
                            width: 0,
                            height: 0,
                            borderTop: "36px solid transparent",
                            borderBottom: "36px solid transparent",
                            borderLeft: "14px solid rgba(189,14,13,0.55)",
                          }} />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800 border-l-4 border-[#BD0E0D] rounded-r-lg shadow-md my-6 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-[#BD0E0D]/10 dark:bg-[#BD0E0D]/30 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-[#BD0E0D]"
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
                              className="w-5 h-5 animate-spin text-[#BD0E0D]"
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
                    <div className="bg-[#BD0E0D]/5 dark:bg-[#BD0E0D]/10 px-6 py-3 border-t border-[#BD0E0D]/10 dark:border-[#BD0E0D]/30">
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
                <AktuellesPreview />
                <Events />
                <div className="flex flex-col">
                  <SideBanner50 />
                  <PartyBanner />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

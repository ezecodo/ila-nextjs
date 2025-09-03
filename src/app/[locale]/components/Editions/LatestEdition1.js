"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog } from "@headlessui/react";
import Image from "next/image";
import Link from "next/link";
import DonationBanner from "../DonationBanner/DonationBanner";
import Events from "../Events/Events";
import EntityBadges from "../EntityBadges/EntityBadges";
import MiniArticleCardGrid from "../Articles/MiniArticleCardGrid";
import { useTranslations, useLocale } from "next-intl";
import { PrevArrow, NextArrow } from "../Articles/CustomArrows/CustomArrows";
import Slider from "../SafeSlick/SafeSlick";
import { useRouter } from "next/navigation";
import IlaLoader from "../../components/IlaLoader/IlaLoader";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function LatestEditionWithArticles() {
  const [editions, setEditions] = useState([]);
  const [currentEditionIndex, setCurrentEditionIndex] = useState(0);
  const [articles, setArticles] = useState([]);
  const [editionsCount, setEditionsCount] = useState({});
  const [popupImage, setPopupImage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(null);
  const listRef = useRef(null);

  const locale = useLocale();
  const t = useTranslations("dossiers");
  const router = useRouter();

  // ✅ UI del picker
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  const currentEdition = editions[currentEditionIndex];

  useEffect(() => {
    async function fetchAllEditions() {
      try {
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

        if (byNumberDesc.length) {
          await fetchArticles(byNumberDesc[0].id);
          await fetchEditionsCount(byNumberDesc[0]);
          setCurrentEditionIndex(0);
        }
      } catch (e) {
        console.error("Error cargando ediciones:", e);
        setEditions([]);
      }
    }
    fetchAllEditions();
  }, []);

  useEffect(() => {
    if (editions[currentEditionIndex]) {
      fetchArticles(editions[currentEditionIndex].id);
      fetchEditionsCount(editions[currentEditionIndex]);
    }
  }, [currentEditionIndex]);

  async function fetchArticles(editionId) {
    const res = await fetch(`/api/articles/list?editionId=${editionId}`);
    const data = await res.json();
    setArticles(data.articles || []);
  }

  async function fetchEditionsCount(edition) {
    const regions = await Promise.all(
      edition.regions.map(async (region) => {
        const res = await fetch(
          `/api/count/regions/${region.id}?context=editions`
        );
        const data = await res.json();
        return { id: region.id, count: data.count };
      })
    );
    const topics = await Promise.all(
      edition.topics.map(async (topic) => {
        const res = await fetch(
          `/api/count/topics/${topic.id}?context=editions`
        );
        const data = await res.json();
        return { id: topic.id, count: data.count };
      })
    );
    setEditionsCount({
      regions: Object.fromEntries(regions.map(({ id, count }) => [id, count])),
      topics: Object.fromEntries(topics.map(({ id, count }) => [id, count])),
    });
  }

  const filteredArticles =
    locale === "es"
      ? articles.filter((a) => a.isTranslatedES && !a.needsReviewES)
      : articles;

  // 👉 helper: ¿la 1ª imagen es vertical?
  const isVertical = (img) =>
    img?.width && img?.height && Number(img.height) > Number(img.width);

  // 👉 1ª imagen de cada artículo (puede venir como images[0] o como image simple)
  const firstImg = (a) => a?.images?.[0] || a?.image || null;

  // 👉 separar en tres grupos
  const horizontalArticles = filteredArticles.filter(
    (a) => firstImg(a) && !isVertical(firstImg(a))
  );
  const verticalArticles = filteredArticles.filter(
    (a) => firstImg(a) && isVertical(firstImg(a))
  );
  const withoutImage = filteredArticles.filter((a) => !firstImg(a));

  // 👉 orden final: horizontales → verticales → sin imagen
  const orderedArticles = [
    ...horizontalArticles,
    ...verticalArticles,
    ...withoutImage,
  ];

  // 👇 usa el nuevo orden
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

  // ✅ helpers del picker
  const focusInputSoon = () => setTimeout(() => inputRef.current?.focus(), 0);

  // cerrar popover al click fuera
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
              <div className="bg-white shadow-lg p-2 pt-0 flex flex-col gap-4 items-center w-full max-w-sm">
                {/* Título + flechas */}
                <div className="relative w-full">
                  <div className="flex items-center justify-center">
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
                      {currentEditionIndex < editions.length - 1 && (
                        <PrevArrow
                          onClick={() => setCurrentEditionIndex((i) => i + 1)}
                        />
                      )}
                    </div>

                    {/* Centro: número y datos de la edición */}
                    <div className="text-center mx-10 flex flex-col items-center space-y-1">
                      <div className="flex items-baseline justify-center gap-3 leading-none relative">
                        {/* ✅ botón "ila NNN" que abre el picker */}
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
                          <span className="font-bold text-xs md:text-sm text-black dark:text-white leading-none">
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

                        {/* ✅ popover del picker */}
                        {showNumberPicker && (
                          <div
                            ref={popoverRef}
                            className="absolute z-30 top-full mt-2 left-1/2 -translate-x-1/2 bg-white border rounded-lg shadow-lg w-56 p-2"
                          >
                            <label className="block text-xs text-gray-500 mb-1">
                              Ir a edición por número
                            </label>
                            <input
                              ref={inputRef}
                              type="number"
                              value={pickerValue}
                              className="w-full border rounded px-2 py-1 text-sm"
                              placeholder="Ej: 481"
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
                                      "w-full text-left px-2 py-1 rounded text-sm hover:bg-red-50",
                                      isHighlighted
                                        ? "bg-red-100 ring-1 ring-red-300"
                                        : "",
                                      !isHighlighted && isActive
                                        ? "bg-red-100/60"
                                        : "",
                                    ].join(" ")}
                                    onClick={() => {
                                      setCurrentEditionIndex(idx);
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
                                className="text-sm text-gray-600 hover:underline"
                                onClick={() => setShowNumberPicker(false)}
                              >
                                Cerrar
                              </button>
                              <button
                                type="button"
                                className="text-sm text-blue-700 hover:underline"
                                onClick={() =>
                                  router.push(`/editions/${currentEdition.id}`)
                                }
                              >
                                Ver edición
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* título del dossier */}
                      <div className="font-serif font-bold text-red-800 text-xl md:text-2xl leading-snug">
                        {locale === "es" && currentEdition.titleES
                          ? currentEdition.titleES
                          : currentEdition.title}
                      </div>
                    </div>

                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                      {currentEditionIndex > 0 && (
                        <NextArrow
                          onClick={() => setCurrentEditionIndex((i) => i - 1)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Portada */}
                <div
                  className="relative w-full cursor-pointer"
                  onClick={() => {
                    if (currentEdition.coverImage) {
                      setPopupImage(currentEdition.coverImage);
                      setIsOpen(true);
                    }
                  }}
                >
                  <Image
                    src={currentEdition.coverImage}
                    alt={`Portada de ${currentEdition.title}`}
                    width={300}
                    height={400}
                    className="shadow-md object-cover w-full h-auto"
                    priority
                  />
                </div>

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
              {/* Artículos en escritorio */}
              <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderedArticles.length > 0 ? (
                  orderedArticles.map((article) => (
                    <MiniArticleCardGrid key={article.id} article={article} />
                  ))
                ) : (
                  <div className="flex items-center justify-center col-span-full h-[400px]">
                    <IlaLoader />
                  </div>
                )}
              </div>

              {/* Artículos en móvil */}
              <div className="block lg:hidden w-full bg-red-50 text-center py-3 rounded-t shadow-sm border-t border-b border-red-200">
                <span className="text-sm text-red-800 font-semibold tracking-wide">
                  ⬇ {t("articlesFromDossier")}{" "}
                  <span className="italic">
                    &quot;{currentEdition.title}&quot;
                  </span>
                </span>
              </div>

              <div className="block lg:hidden w-full mt-0">
                {orderedArticles.length > 0 ? (
                  <Slider {...mobileCarouselSettings}>
                    {orderedArticles.map((article) => (
                      <div key={article.id} className="w-full">
                        <MiniArticleCardGrid article={article} />
                      </div>
                    ))}
                  </Slider>
                ) : (
                  <p className="text-gray-500">{t("noArticlesInEdition")}</p>
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

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      >
        <Dialog.Panel className="relative bg-white rounded-lg shadow-lg p-4 max-w-[500px]">
          {popupImage && (
            <Image
              src={popupImage}
              alt={`Portada de ${currentEdition?.title}`}
              width={400}
              height={520}
              className="rounded-lg object-contain w-full h-auto"
              priority
            />
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-white bg-red-600 hover:bg-red-800 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full"
          >
            ✕
          </button>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

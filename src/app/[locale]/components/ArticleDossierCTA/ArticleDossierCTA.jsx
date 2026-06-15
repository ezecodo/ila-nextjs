"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FaShoppingCart, FaCheck, FaTabletAlt } from "react-icons/fa";
import { useCart } from "../Cart/CartContext";

// CTA al final del artículo: alude al Dossier donde aparece e invita a
// comprarlo o a suscribirse al Abo digital. Estética del DonationPopUp
// (header rojo con onda blanca + cuerpo blanco), pero inline (no modal).
export default function ArticleDossierCTA({ edition, currentArticleId }) {
  const locale = useLocale();
  const isES = locale === "es";
  const t = useTranslations("articleDossierCta");
  const router = useRouter();
  const { addToCart, isInCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (!edition?.number) return;
    let aborted = false;
    fetch(`/api/articles/edition/${edition.number}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!aborted && Array.isArray(data)) setArticles(data);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, [edition?.number]);

  if (!edition?.id) return null;

  const title = isES && edition.titleES ? edition.titleES : edition.title;
  const type = edition.isSpecialOffer ? "offer" : "normal";
  const inCart = isInCart(edition.id, type);

  const otherArticles = articles.filter((a) => a.id !== currentArticleId);

  const handleBuy = () => {
    addToCart(edition.id, type, 1);
    setJustAdded(true);
    setTimeout(() => {
      router.push(`/${locale}/order/single-dossier-order?focus=cart`);
    }, 450);
  };

  return (
    <section className="mt-12 mb-4 overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
      {/* Header con la portada del Dossier de fondo + onda blanca */}
      <div className="relative p-5 sm:p-7 pb-9 sm:pb-11">
        {/* Fondo: portada del Dossier desenfocada + velo oscuro para legibilidad */}
        {edition.coverImage && (
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <Image
              src={edition.coverImage}
              alt=""
              fill
              className="object-cover scale-110 blur-[3px]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/55" />
          </div>
        )}

        <div className="relative flex items-start gap-4 sm:gap-6">
          {/* Portada del dossier */}
          {edition.coverImage && (
            <Link
              href={`/${locale}/editions/${edition.id}`}
              className="shrink-0 block w-[84px] sm:w-[110px] border-x-[4px] border-t-[4px] border-white transition-transform duration-200 hover:scale-[1.03]"
              style={{ boxShadow: "0 8px 20px -10px rgba(0,0,0,0.45)" }}
            >
              <Image
                src={edition.coverImage}
                alt={title || `ila ${edition.number}`}
                width={220}
                height={293}
                className="block object-cover w-full h-auto"
              />
            </Link>
          )}

          {/* Texto hero + lista de artículos del Dossier */}
          <div className="text-white min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wide opacity-90">
              {t("eyebrow")}
            </p>
            <p
              className="text-lg sm:text-2xl font-bold leading-none mt-1"
              style={{ fontFamily: "Futura, sans-serif" }}
            >
              ila {edition.number}
            </p>
            {title && (
              <p className="text-sm sm:text-lg font-light opacity-95 mt-1 leading-snug">
                {title}
              </p>
            )}

            {/* Lista de artículos del Dossier (scrolleable) */}
            {otherArticles.length > 0 && (
              <div
                className="mt-3 p-3 sm:p-4"
                style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1.5">
                  {t("moreInDossier", { count: otherArticles.length })}
                </p>
                <ul className="max-h-[150px] sm:max-h-[180px] overflow-y-auto pr-2 divide-y divide-white/15 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-thumb]:bg-white/40 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {otherArticles.map((a) => {
                    const aTitle =
                      isES && a.isTranslatedES && a.titleES
                        ? a.titleES
                        : a.title;
                    const authorNames = a.authors
                      ?.map((au) => au.name)
                      .join(", ");
                    return (
                      <li key={a.id}>
                        <Link
                          href={`/${locale}${a.legacyPath}`}
                          className="group block py-1.5 transition-colors"
                        >
                          <span className="block text-[13px] font-bold leading-snug text-white group-hover:underline decoration-white/60 underline-offset-2">
                            {aTitle}
                          </span>
                          {authorNames && (
                            <span className="block text-[11px] italic leading-tight text-white/70 group-hover:text-white/90 mt-0.5">
                              {authorNames}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Onda suave inferior */}
        <div
          className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]"
          style={{ height: "36px" }}
        >
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="relative block w-full h-full"
          >
            <path
              d="M0,50 C150,20 300,80 450,50 C600,20 750,80 900,50 C1050,20 1150,50 1200,40 L1200,120 L0,120 Z"
              className="fill-white dark:fill-gray-900"
            />
          </svg>
        </div>
      </div>

      {/* Cuerpo blanco */}
      <div className="bg-white dark:bg-gray-900 p-5 sm:p-7">
        <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100 text-center leading-snug mb-5 sm:mb-7">
          {t("hook")}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {edition.isAvailableToOrder && (
            <button
              type="button"
              onClick={handleBuy}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white font-bold text-sm sm:text-base uppercase tracking-wide shadow-lg hover:bg-red-700 transition-all duration-200 hover:-translate-y-0.5"
            >
              {justAdded ? (
                <>
                  <FaCheck className="w-4 h-4" />
                  {t("added")}
                </>
              ) : (
                <>
                  <FaShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {inCart ? t("orderMoreButton") : t("orderButton")}
                </>
              )}
            </button>
          )}

          <Link
            href={`/${locale}/order/abo`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 font-bold text-sm sm:text-base uppercase tracking-wide border-2 border-red-600 dark:border-red-400 shadow-sm hover:bg-red-50 dark:hover:bg-gray-700 transition-all duration-200 hover:-translate-y-0.5"
          >
            <FaTabletAlt className="w-4 h-4" />
            {t("aboButton")}
          </Link>
        </div>
      </div>
    </section>
  );
}

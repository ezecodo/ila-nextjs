"use client";

import { useTranslations } from "next-intl";
import AboForm from "../abo/components/AboForm/AboForm";
import DigitalAboShowcase from "./DigitalAboShowcase";
import { DigiAboMark } from "./Wordmark";

export default function DigitalAboPage() {
  const t = useTranslations("digitalAbo");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Hero ── */}
      <div
        className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 relative text-white overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #46663f 0%, #2c4327 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-55deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px)",
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-10">
            {/* Izquierda: DIGIabo en formato botón (ribete cyan, sin glow) */}
            <div className="flex justify-center md:justify-end shrink-0">
              <DigiAboMark glow={false} size="lg" />
            </div>

            {/* Derecha: texto */}
            <div className="text-center md:text-left max-w-md">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] mb-4 text-balance">
                {t("heroTitle")
                  .split(/(\bila\b)/i)
                  .map((part, i) =>
                    /^ila$/i.test(part) ? (
                      <span
                        key={i}
                        className="lowercase inline-block"
                        style={{
                          fontFamily:
                            "'Futura PT', Futura, 'Jost', var(--font-futura), sans-serif",
                          fontWeight: 600,
                          letterSpacing: "-0.03em",
                          fontSize: "1.5em",
                          lineHeight: 0,
                          verticalAlign: "baseline",
                        }}
                      >
                        ila
                      </span>
                    ) : (
                      part
                    ),
                  )}
              </h1>
              <p className="text-white/90 text-base md:text-lg font-light leading-snug">
                {t("heroSubtitle")}
              </p>
            </div>
          </div>
        </div>
        <svg
          className="w-full block"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"
            className="fill-gray-50 dark:fill-gray-950"
          />
        </svg>
      </div>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-4 pt-10 md:pt-14">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t("featuresTitle")}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            {t("featuresSubtitle")}
          </p>
        </div>
        <DigitalAboShowcase />

        {/* ── CTA + precio ── */}
        <div className="mt-10 flex flex-col items-center">
          <a
            href="#form"
            className="inline-block shadow-lg transition-transform duration-200 hover:-translate-y-0.5 no-underline"
          >
            <DigiAboMark glow={false} prefix={t("heroCta")} />
          </a>
          <p className="mt-4 text-gray-700 dark:text-gray-200 font-semibold text-sm md:text-base">
            {t("heroPrice")}
          </p>
        </div>
      </section>

      {/* ── Form ── */}
      <section id="form" className="max-w-4xl mx-auto px-3 md:px-4 pt-12 pb-16 scroll-mt-20">
        <div className="text-center mb-2">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t("formTitle")}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm md:text-base">
            {t("formSubtitle")}
          </p>
        </div>
        <AboForm gifts={[]} digital />
      </section>
    </div>
  );
}

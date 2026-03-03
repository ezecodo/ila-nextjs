"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import AboForm from "./components/AboForm/AboForm";

export default function AboPage() {
  const t = useTranslations("abo");
  const [gifts, setGifts] = useState([]);

  useEffect(() => {
    async function loadGifts() {
      try {
        const res = await fetch("/api/gifts");
        const data = await res.json();
        setGifts(data);
      } catch (err) {
        console.error("Error cargando premios:", err);
      }
    }
    loadGifts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Hero — márgenes negativos para romper el padding de LayoutShell ── */}
      <div className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 relative bg-[#BD0E0D] text-white overflow-hidden">
        {/* Decorative diagonal stripe */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-55deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-14 text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-2">
            {t("title")}
          </h1>
          <p className="text-white/70 text-sm md:text-base font-semibold uppercase tracking-widest mb-6">
            {t("heroSubtitle")}
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6">
            {[t("benefit1"), t("benefit2"), t("benefit3")].map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium"
              >
                <span className="text-white/70">✓</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
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

      {/* ── Form ── */}
      <div className="max-w-4xl mx-auto px-3 md:px-4 pb-14 -mt-2">
        <AboForm gifts={gifts} />
      </div>
    </div>
  );
}

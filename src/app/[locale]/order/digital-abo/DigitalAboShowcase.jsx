"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const GLOBILA_MAP_SRC = "/digital-abo/globila-map.png";

const SLIDE_MS = 6000;
const COUNT = 6;

/* ── Mockups CSS por feature (no screenshots: UI simulada on-brand) ── */

function MockFavorites() {
  const rows = [
    { t: "Bolivien nach den Wahlen", tag: "Politik", on: true },
    { t: "Mapuche: Territorium & Recht", tag: "Indigene", on: true },
    { t: "Lithium im Dreiländereck", tag: "Umwelt", on: false },
    { t: "Feminismus in Argentinien", tag: "Gesellschaft", on: true },
  ];
  return (
    <div className="w-full max-w-md space-y-3">
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2.5 shadow-sm"
          style={{ transform: `translateX(${i % 2 ? 10 : 0}px)` }}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 shrink-0 ${r.on ? "text-[#BD0E0D]" : "text-gray-300 dark:text-gray-600"}`}
            fill="currentColor"
          >
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100 truncate flex-1">
            {r.t}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wide text-[#BD0E0D] bg-[#BD0E0D]/10 px-1.5 py-0.5 whitespace-nowrap">
            {r.tag}
          </span>
        </div>
      ))}
    </div>
  );
}

/* Portada de revista — usa una portada real si la hay, si no un fallback. */
function Cover({ src, label, className = "" }) {
  return (
    <div
      className={`relative aspect-[3/4] bg-[#7a0908] overflow-hidden shadow-md ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col p-2">
          <span
            className="text-white text-base font-bold leading-none"
            style={{ fontFamily: "var(--font-futura), sans-serif" }}
          >
            ila
          </span>
          <div className="mt-auto space-y-1">
            <div className="h-1 w-full bg-white/80" />
            <div className="h-1 w-2/3 bg-white/50" />
          </div>
        </div>
      )}
      {label && (
        <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[8px] font-semibold px-1.5 py-1 leading-tight line-clamp-2">
          {label}
        </span>
      )}
    </div>
  );
}

function MockPdfPackage({ covers }) {
  const items = [
    { c: covers[0], t: "Bolivien nach den Wahlen" },
    { c: covers[1], t: "Mapuche: Territorium" },
    { c: covers[2], t: "Lithium-Boom" },
  ];
  return (
    <div className="relative w-full max-w-md">
      <div className="grid grid-cols-3 gap-2 mb-5">
        {items.map((it, i) => (
          <Cover
            key={i}
            src={it.c}
            label={it.t}
            className="border border-white/20"
          />
        ))}
      </div>
      <div className="flex justify-center text-[#BD0E0D]">
        <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
          <path d="M12 3a1 1 0 011 1v9.6l3.3-3.3 1.4 1.4L12 17.4l-5.7-5.7 1.4-1.4L11 13.6V4a1 1 0 011-1z" />
        </svg>
      </div>
      <div className="mt-3 flex items-center gap-2 bg-[#BD0E0D] text-white px-3 py-2.5 shadow-lg">
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
          <path d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm6 1.5V8h3.5L13 4.5z" />
        </svg>
        <span className="text-[12px] font-bold uppercase tracking-wide">
          mein-dossier.pdf
        </span>
      </div>
    </div>
  );
}

function MockEarlyAccess({ covers }) {
  return (
    <div className="w-full max-w-[15rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
      <div className="relative">
        <Cover src={covers[0]} className="aspect-[3/4]" />
        {/* Velo + candado */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#BD0E0D]" fill="currentColor">
              <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
            </svg>
          </div>
        </div>
        <span className="absolute top-2 left-2 bg-[#BD0E0D] text-white text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 shadow">
          Vorab-Zugang
        </span>
      </div>
      <div className="p-3.5">
        <h4 className="text-[13px] font-bold leading-snug text-gray-900 dark:text-gray-100">
          Bolivien: Was nach den Wahlen kommt
        </h4>
        <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
          Schon jetzt lesen — vor der offiziellen Veröffentlichung.
        </p>
      </div>
    </div>
  );
}

function SchematicGlobe() {
  return (
    <div className="relative w-44 h-44 sm:w-52 sm:h-52">
      <div className="absolute inset-0 rounded-full border-2 border-[#BD0E0D]/30" />
      <div className="absolute inset-0 rounded-full border border-[#BD0E0D]/20 rotate-45 scale-y-[0.4]" />
      <div className="absolute inset-0 rounded-full border border-[#BD0E0D]/20 scale-x-[0.4]" />
      <div className="absolute inset-0 rounded-full bg-[#BD0E0D]/5" />
      {[
        [30, 35],
        [55, 28],
        [42, 55],
        [62, 62],
        [35, 70],
        [70, 45],
      ].map(([top, left], i) => (
        <span
          key={i}
          className="absolute w-2.5 h-2.5 rounded-full bg-[#BD0E0D] shadow"
          style={{ top: `${top}%`, left: `${left}%` }}
        />
      ))}
    </div>
  );
}

function MockGlobe() {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="w-full max-w-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md overflow-hidden">
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={GLOBILA_MAP_SRC}
          alt="GLOBila"
          className="block w-full h-auto max-h-[380px] object-contain"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="flex items-center justify-center py-8">
          <SchematicGlobe />
        </div>
      )}
    </div>
  );
}

function MockDownload({ covers }) {
  return (
    <div className="relative w-56">
      <Cover src={covers[0]} className="shadow-lg" />
      <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-[#BD0E0D] text-white flex items-center justify-center shadow-xl ring-4 ring-gray-50 dark:ring-gray-900/40">
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
          <path d="M12 3a1 1 0 011 1v9.6l3.3-3.3 1.4 1.4L12 17.4l-5.7-5.7 1.4-1.4L11 13.6V4a1 1 0 011-1zM5 19h14v2H5v-2z" />
        </svg>
      </div>
    </div>
  );
}

function MockReader() {
  return (
    <div className="w-full max-w-md bg-[#0a0a0a] border border-gray-800 shadow-2xl p-8 sm:p-9">
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Lesemodus
        </span>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-700" />
          <span className="w-2 h-2 rounded-full bg-gray-700" />
          <span className="w-2 h-2 rounded-full bg-[#BD0E0D]" />
        </div>
      </div>
      <h4
        className="text-gray-100 text-lg sm:text-xl font-bold leading-snug mb-5"
        style={{ fontFamily: "var(--font-futura), sans-serif" }}
      >
        Bolivien: Was nach den Wahlen kommt
      </h4>
      <div className="space-y-3">
        <div className="h-2.5 w-full bg-gray-700/80" />
        <div className="h-2.5 w-full bg-gray-700/80" />
        <div className="h-2.5 w-5/6 bg-gray-700/80" />
        <div className="h-2.5 w-full bg-gray-700/80" />
        <div className="h-2.5 w-11/12 bg-gray-700/80" />
        <div className="h-2.5 w-full bg-gray-700/80" />
        <div className="h-2.5 w-2/3 bg-gray-700/80" />
      </div>
    </div>
  );
}

const MOCKS = [
  MockFavorites,
  MockPdfPackage,
  MockEarlyAccess,
  MockGlobe,
  MockDownload,
  MockReader,
];

export default function DigitalAboShowcase() {
  const t = useTranslations("digitalAbo");
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [covers, setCovers] = useState([]);
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/editions?limit=12")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const imgs = (Array.isArray(data) ? data : [])
          .map((d) => d.coverImage)
          .filter(Boolean);
        setCovers(imgs.sort(() => Math.random() - 0.5));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const go = useCallback((i) => setActive(((i % COUNT) + COUNT) % COUNT), []);

  const running = inView;

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % COUNT), SLIDE_MS);
    return () => clearTimeout(id);
  }, [active, running]);

  const startX = useRef(null);
  const onTouchStart = (e) => (startX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
    startX.current = null;
  };

  const Mock = MOCKS[active];
  const n = active + 1;

  return (
    <div
      ref={rootRef}
      className="relative select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Barras de progreso tipo stories */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: COUNT }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Slide ${i + 1}`}
            className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 overflow-hidden"
          >
            <span
              className="block h-full bg-[#BD0E0D]"
              style={{
                width: i < active ? "100%" : "0%",
                animation:
                  i === active && running
                    ? `dabar ${SLIDE_MS}ms linear forwards`
                    : "none",
              }}
            />
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes dabar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>

      {/* Slide */}
      <div className="relative overflow-hidden rounded-sm shadow-2xl ring-1 ring-black/5">
        <div className="grid md:grid-cols-5 min-h-[460px] md:h-[500px]">
          {/* Visual */}
          <div
            key={`v-${active}`}
            className="relative order-2 md:order-1 md:col-span-3 flex items-center justify-center p-8 md:p-10 bg-gray-100 dark:bg-gray-900 overflow-hidden animate-[fadeIn_0.5s_ease]"
          >
            {/* trama diagonal */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-55deg, #BD0E0D 0px, #BD0E0D 1px, transparent 1px, transparent 22px)",
              }}
            />
            {/* glow rojo de foco */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgba(189,14,13,0.10), transparent 62%)",
              }}
            />
            <div className="relative drop-shadow-xl max-h-full">
              <Mock covers={covers} />
            </div>
          </div>

          {/* Texto */}
          <div
            key={`t-${active}`}
            className="relative order-1 md:order-2 md:col-span-2 flex flex-col justify-center p-8 md:p-10 bg-[#89B881] text-white overflow-hidden animate-[fadeIn_0.6s_ease]"
          >
            {/* barra de acento */}
            <span className="absolute left-0 top-0 h-full w-1 bg-[#BD0E0D] md:block hidden" />
            <div
              className="flex items-baseline gap-2 mb-4"
              style={{ fontFamily: "var(--font-futura), sans-serif" }}
            >
              <span className="text-white text-6xl md:text-7xl leading-none font-bold drop-shadow-sm">
                {String(n).padStart(2, "0")}
              </span>
              <span className="text-white/50 text-xl md:text-2xl font-bold">
                / {String(COUNT).padStart(2, "0")}
              </span>
            </div>
            <h3
              className="text-2xl md:text-3xl font-bold leading-tight text-white mb-3 text-balance"
              style={{ fontFamily: "var(--font-futura), sans-serif" }}
            >
              {n === 4 ? (
                <>
                  <span className="text-white">GLOB</span>
                  <span className="text-[#BD0E0D]">ila</span>
                  {t("feature4Title").replace(/^GlobIla/i, "")}
                </>
              ) : (
                t(`feature${n}Title`)
              )}
            </h3>
            <p className="text-[15px] md:text-base text-white/90 leading-relaxed">
              {t(`feature${n}Desc`)}
            </p>
          </div>
        </div>

        {/* Flechas */}
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white text-gray-800 shadow-lg hover:bg-[#BD0E0D] hover:text-white transition-colors"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-white text-gray-800 shadow-lg hover:bg-[#BD0E0D] hover:text-white transition-colors"
        >
          ›
        </button>
      </div>
    </div>
  );
}

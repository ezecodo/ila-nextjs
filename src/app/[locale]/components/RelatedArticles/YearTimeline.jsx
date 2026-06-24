"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Timeline horizontal con histograma (artículos por año) y dos marcadores
// arrastrables para acotar el rango. Sin dependencias.
// Props:
//   yearCounts: [{ year, count }] ascendente (puede tener huecos)
//   from, to: años seleccionados (números)
//   onChange(from, to)
export default function YearTimeline({ yearCounts, from, to, onChange }) {
  const trackRef = useRef(null);
  const [drag, setDrag] = useState(null); // "from" | "to" | null

  const minYear = yearCounts?.[0]?.year;
  const maxYear = yearCounts?.[yearCounts.length - 1]?.year;
  const span = (maxYear ?? 0) - (minYear ?? 0) || 1;

  const yearAtClientX = useCallback(
    (clientX) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return minYear;
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return Math.round(minYear + ratio * span);
    },
    [minYear, span],
  );

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const y = yearAtClientX(e.clientX);
      if (drag === "from") onChange(Math.min(y, to), to);
      else onChange(from, Math.max(y, from));
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, from, to, onChange, yearAtClientX]);

  if (!yearCounts || yearCounts.length === 0 || minYear === maxYear) return null;

  const maxCount = Math.max(...yearCounts.map((yc) => yc.count), 1);
  const countMap = new Map(yearCounts.map((yc) => [yc.year, yc.count]));
  const allYears = [];
  for (let y = minYear; y <= maxYear; y++) allYears.push(y);

  const pct = (year) => ((year - minYear) / span) * 100;

  const onKey = (handle) => (e) => {
    let delta = 0;
    if (e.key === "ArrowLeft") delta = -1;
    else if (e.key === "ArrowRight") delta = 1;
    else return;
    e.preventDefault();
    if (handle === "from") onChange(Math.min(Math.max(from + delta, minYear), to), to);
    else onChange(from, Math.max(Math.min(to + delta, maxYear), from));
  };

  return (
    <div className="select-none">
      {/* Histograma */}
      <div
        ref={trackRef}
        className="relative flex h-16 items-end gap-px"
        style={{ touchAction: "none" }}
      >
        {/* Banda seleccionada */}
        <div
          className="pointer-events-none absolute inset-y-0 bg-[#BD0E0D]/10"
          style={{ left: `${pct(from)}%`, right: `${100 - pct(to)}%` }}
        />
        {allYears.map((y) => {
          const count = countMap.get(y) || 0;
          const inRange = y >= from && y <= to;
          return (
            <div
              key={y}
              className="relative flex-1"
              style={{ height: "100%" }}
              title={`${y}: ${count}`}
            >
              <div
                className={`absolute bottom-0 w-full transition-colors ${
                  inRange ? "bg-[#BD0E0D]" : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{
                  height: `${Math.max((count / maxCount) * 100, count > 0 ? 6 : 0)}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Eje + marcadores */}
      <div className="relative mt-1 h-8">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gray-200 dark:bg-gray-700" />
        <div
          className="absolute top-0 h-[2px] bg-[#BD0E0D]"
          style={{ left: `${pct(from)}%`, right: `${100 - pct(to)}%` }}
        />

        {[
          { handle: "from", year: from },
          { handle: "to", year: to },
        ].map(({ handle, year }) => (
          <div
            key={handle}
            role="slider"
            tabIndex={0}
            aria-label={handle === "from" ? "Desde" : "Hasta"}
            aria-valuemin={minYear}
            aria-valuemax={maxYear}
            aria-valuenow={year}
            onKeyDown={onKey(handle)}
            onPointerDown={(e) => {
              e.preventDefault();
              setDrag(handle);
            }}
            className="absolute top-0 -translate-x-1/2 cursor-ew-resize touch-none"
            style={{ left: `${pct(year)}%` }}
          >
            <div className="h-4 w-4 -translate-y-[7px] rounded-full border-2 border-white bg-[#BD0E0D] shadow-md ring-1 ring-black/10" />
            <span className="mt-0.5 block -translate-x-1/2 text-[12px] font-bold text-[#BD0E0D]" style={{ marginLeft: "8px" }}>
              {year}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

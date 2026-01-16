"use client";

import React, { useState, useEffect } from "react";

const countries = [
  "México",
  "Guatemala",
  "Honduras",
  "El Salvador",
  "Nicaragua",
  "Costa Rica",
  "Panamá",
  "Cuba",
  "República Dominicana",
  "Puerto Rico",
  "Colombia",
  "Venezuela",
  "Ecuador",
  "Perú",
  "Bolivia",
  "Chile",
  "Argentina",
  "Uruguay",
  "Paraguay",
  "Brasil",
  "Haití",
  "Belice",
  "Suriname",
  "Guyana",
  "Trinidad y Tobago",
];

const rowConfigs = [
  { size: "text-lg", offset: "0%" },
  { size: "text-2xl", offset: "-10%" },
  { size: "text-sm", offset: "5%" },
  { size: "text-xl", offset: "-5%" },
  { size: "text-base", offset: "15%" },
  { size: "text-lg", offset: "-15%" },
];

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function LatinAmericaBackground({ compact = false }) {
  const [rows, setRows] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Generar el shuffle solo en el cliente
    const shuffledRows = rowConfigs.map((config) => ({
      countries: shuffle(countries),
      size: config.size,
      offset: config.offset,
    }));
    setRows(shuffledRows);
    setMounted(true);
  }, []);

  // No renderizar nada hasta que el cliente monte (evita hydration mismatch)
  if (!mounted) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-0 flex flex-col justify-center gap-3 ${compact ? "opacity-[0.06]" : "opacity-[0.10]"}`}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`whitespace-nowrap ${row.size} font-bold uppercase tracking-widest text-white`}
            style={{
              marginLeft: row.offset,
            }}
          >
            {[...row.countries, ...row.countries, ...row.countries].map(
              (country, i) => (
                <span key={`${rowIndex}-${i}`} className="mx-4 inline-block">
                  {country}
                </span>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

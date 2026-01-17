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
];

const sizesConfig = {
  desktop: ["text-sm", "text-xl", "text-3xl", "text-lg"],
  mobile: ["text-[6px]", "text-[8px]", "text-[10px]", "text-[7px]"],
};

const rowsConfig = {
  desktop: 8,
  mobile: 4,
};

const styleConfig = {
  desktop: { opacity: "opacity-[0.10]", py: "py-4", mx: "mx-4" },
  mobile: { opacity: "opacity-[0.12]", py: "py-1", mx: "mx-2" },
};

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function LatinAmericaBackground({ variant = "desktop" }) {
  const [rows, setRows] = useState([]);
  const [mounted, setMounted] = useState(false);

  const sizes = sizesConfig[variant] || sizesConfig.desktop;
  const numRows = rowsConfig[variant] || rowsConfig.desktop;
  const styles = styleConfig[variant] || styleConfig.desktop;

  useEffect(() => {
    const newRows = [];

    for (let i = 0; i < numRows; i++) {
      const shuffledCountries = shuffle([...countries, ...countries]);
      const offset = i % 2 === 0 ? 0 : -10;

      newRows.push({
        countries: shuffledCountries,
        offset,
      });
    }

    setRows(newRows);
    setMounted(true);
  }, [numRows]);

  if (!mounted) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" />
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-0 flex flex-col justify-between ${styles.py} ${styles.opacity}`}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="whitespace-nowrap text-white font-bold uppercase tracking-wide"
            style={{ marginLeft: `${row.offset}%` }}
          >
            {row.countries.map((country, i) => {
              let sizeIndex = i % sizes.length;
              const prevIndex = i > 0 ? (i - 1) % sizes.length : -1;
              if (sizeIndex === prevIndex) {
                sizeIndex = (sizeIndex + 1) % sizes.length;
              }

              return (
                <span
                  key={`${rowIndex}-${i}`}
                  className={`${styles.mx} inline-block ${sizes[sizeIndex]}`}
                >
                  {country}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

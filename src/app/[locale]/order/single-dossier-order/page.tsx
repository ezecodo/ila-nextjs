"use client";

import { useEffect, useState } from "react";
import EditionsCarousel from "../../components/Editions/EditionsCarousel/EditionsCarousel";

type Edition = {
  id: string;
  number: number;
  title: string;
  titleES?: string;
  datePublished?: string;
  coverImage?: string;
  isAvailableToOrder: boolean;
  isOnSale?: boolean;
};

export default function SingleDossierOrderPage() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>("all");

  useEffect(() => {
    fetch("/api/editions")
      .then((res) => res.json())
      .then((data: Edition[]) => {
        const available = data.filter((e) => e.isAvailableToOrder);
        setEditions(available);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading editions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center">Loading...</p>;

  // 👉 Obtener años únicos
  const years: number[] = Array.from(
    new Set(
      editions
        .map((e) =>
          e.datePublished ? new Date(e.datePublished).getFullYear() : null
        )
        .filter((y): y is number => y !== null) // 👈 narrow type
    )
  ).sort((a, b) => b - a);

  // 👉 Filtrar por año
  const filtered =
    year === "all"
      ? editions
      : editions.filter(
          (e) =>
            e.datePublished &&
            new Date(e.datePublished).getFullYear().toString() === year
        );

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        Order Single Dossiers
      </h1>

      {/* Selector de años (chips compactos) */}
      {years.length > 0 && (
        <div className="flex justify-center mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setYear("all")}
              className={`px-3 py-1 rounded-full text-sm transition whitespace-nowrap ${
                year === "all"
                  ? "bg-red-700 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(String(y))}
                className={`px-3 py-1 rounded-full text-sm transition whitespace-nowrap ${
                  year === String(y)
                    ? "bg-red-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <EditionsCarousel editions={filtered} />
      ) : (
        <p className="text-center text-gray-600">
          No dossiers available for {year === "all" ? "order" : `year ${year}`}.
        </p>
      )}
    </main>
  );
}

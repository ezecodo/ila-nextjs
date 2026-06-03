// app/[locale]/components/AktuellesPreview/AktuellesPreview.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

import SectionHeader from "../SectionsHeader/SetionHeader";

interface Aktuelles {
  id: number;
  title: string;
  titleES: string | null;
  content: string;
  contentES: string | null;
  date: string;
  images?: { url: string; alt: string | null }[];
}

export default function AktuellesPreview() {
  const locale = useLocale();
  const [items, setItems] = useState<Aktuelles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/aktuelles?limit=10")
      .then((res) => res.json())
      .then((data) => {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        // Filtramos por fecha y ordenamos
        const sorted = (data.items || [])
          .filter((item: Aktuelles) => {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);
            twoMonthsAgo.setHours(0, 0, 0, 0);
            return itemDate >= twoMonthsAgo;
          })
          .sort(
            (a: Aktuelles, b: Aktuelles) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .slice(0, 3);

        setItems(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getTitle = (item: Aktuelles) =>
    locale === "es" && item.titleES ? item.titleES : item.title;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === "es" ? "es-ES" : "de-DE", {
      day: "2-digit",
      month: "short",
    });

  if (loading || items.length === 0) return null;

  return (
    <div className="w-full">
      <SectionHeader
        title={locale === "es" ? "Actualidad" : "Aktuelles"}
        rightElement={
          <Link
            href="/aktuell/aktuelles"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors group"
          >
            <span className="border-b border-transparent group-hover:border-white/70 transition-all">
              {locale === "es" ? "Ver archivo" : "Zum Archiv"}
            </span>
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        }
      />

      {/* --- Lista de Noticias --- */}
      <div className="flex flex-col gap-4 mt-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex gap-4 p-3 rounded-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300"
          >
            {/* Contenido Texto */}
            <div className="flex flex-col justify-between flex-1 min-w-0">
              <div>
                {/* Fecha — rojo de marca, igual que el grid */}
                <p className="text-xs font-semibold text-[#BD0E0D] mb-1 uppercase tracking-wider">
                  {formatDate(item.date)}
                </p>

                {/* Título en sans con subrayado animado, alineado al grid */}
                <Link
                  href={`/aktuell/aktuelles?scrollTo=${item.id}`}
                  className="block"
                >
                  <h4 className="text-[17px] font-bold leading-[1.25] text-gray-900 dark:text-gray-100 text-balance">
                    <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
                      {getTitle(item)}
                    </span>
                  </h4>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

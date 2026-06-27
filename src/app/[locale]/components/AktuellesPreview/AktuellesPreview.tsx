// app/[locale]/components/AktuellesPreview/AktuellesPreview.tsx
"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";

import QuietSectionHeader from "../SectionsHeader/QuietSectionHeader";

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
      <QuietSectionHeader
        variant="chip"
        title={locale === "es" ? "Actualidad" : "Aktuelles"}
        rightElement={
          <Link
            href="/aktuell/aktuelles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#BD0E0D] hover:text-[#a50c0b] transition-colors group whitespace-nowrap"
          >
            <span className="border-b border-transparent group-hover:border-[#BD0E0D] transition-all">
              {locale === "es" ? "Ver archivo" : "Zum Archiv"}
            </span>
            <span className="group-hover:translate-x-1 transition-transform">
              →
            </span>
          </Link>
        }
      />

      {/* --- Lista de Noticias: filas sin caja, separadas por hairlines --- */}
      <div className="flex flex-col">
        {items.map((item) => (
          <article
            key={item.id}
            className="group py-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
          >
            {/* Fecha — rojo de marca */}
            <p className="text-[11px] font-semibold text-[#BD0E0D] mb-1 uppercase tracking-wider">
              {formatDate(item.date)}
            </p>

            {/* Título en sans con subrayado animado */}
            <Link href={`/aktuell/aktuelles?scrollTo=${item.id}`} className="block">
              <h4 className="text-[16px] font-bold leading-[1.3] text-gray-900 dark:text-gray-100 text-balance">
                <span className="bg-gradient-to-r from-[#BD0E0D] to-[#BD0E0D] bg-[length:0%_2px] bg-left-bottom bg-no-repeat group-hover:bg-[length:100%_2px] transition-all duration-500">
                  {getTitle(item)}
                </span>
              </h4>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

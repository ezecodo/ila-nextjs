"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";

const PdfReader = dynamic(
  () => import("../../components/PdfReader/PdfReader"),
  { ssr: false }
);

export default function PdfDossiers({ locale }) {
  const [editions, setEditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePdf, setActivePdf] = useState(null); // { url, title }
  const t = useTranslations("user_dashboard.pdf_dossiers");

  useEffect(() => {
    fetch("/api/user/pdf-abo/editions")
      .then((r) => r.json())
      .then((data) => setEditions(data.editions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Visor a pantalla completa
  if (activePdf) {
    return (
      <PdfReader
        pdfUrl={activePdf.url}
        title={activePdf.title}
        onClose={() => setActivePdf(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#BD0E0D] rounded-full animate-spin" />
      </div>
    );
  }

  if (editions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
        <span className="text-4xl">📭</span>
        <p className="text-gray-500 text-sm">
          {t("empty")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">{t("heading")}</h2>
      <p className="text-gray-400 text-sm mb-6">
        {editions.length === 1 ? t("available_one", { count: 1 }) : t("available_other", { count: editions.length })}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {editions.map((edition) => (
          <EditionCard
            key={edition.id}
            edition={edition}
            locale={locale}
            onOpen={() =>
              setActivePdf({
                url: edition.pdf.pdfUrl,
                title: `ila ${edition.number} — ${locale === "es" && edition.titleES ? edition.titleES : edition.title}`,
              })
            }
          />
        ))}
      </div>
    </div>
  );
}

function EditionCard({ edition, locale, onOpen }) {
  const t = useTranslations("user_dashboard.pdf_dossiers");
  const title = locale === "es" && edition.titleES ? edition.titleES : edition.title;
  const year = new Date(edition.datePublished).getFullYear();

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left"
    >
      {/* Portada */}
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        {edition.coverImage ? (
          <Image
            src={edition.coverImage}
            alt={`ila ${edition.number}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, 20vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "#BD0E0D" }}
          >
            <span
              className="text-white text-2xl font-black"
              style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
            >
              ila
            </span>
          </div>
        )}
        {/* Overlay al hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-bold bg-[#BD0E0D] px-3 py-1.5 rounded-lg">
            {t("open")}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-400 font-mono">#{edition.number} · {year}</p>
        <p className="text-xs font-semibold text-gray-700 mt-0.5 line-clamp-2 leading-tight">
          {title}
        </p>
      </div>
    </button>
  );
}

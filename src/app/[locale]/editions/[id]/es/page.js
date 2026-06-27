"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import ArticleList from "../../../components/Articles/ArticleList";
import IlaLoader from "../../../components/IlaLoader/IlaLoader";
import QuietSectionHeader from "../../../components/SectionsHeader/QuietSectionHeader";
import TranslationSupportBanner from "../../../components/TranslationSupportBanner/TranslationSupportBanner";

export default function EditionSpanishArticlesPage() {
  const params = useParams();
  const locale = useLocale();
  const editionId = params.id;
  const isDe = locale === "de";

  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [edition, setEdition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(56);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setHeaderHeight(header.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const esQuery = new URLSearchParams({
          editionId: String(editionId),
          locale: "es",
          limit: "100",
        });
        // Sin locale → todos los artículos publicados del dossier (total).
        const allQuery = new URLSearchParams({
          editionId: String(editionId),
          limit: "100",
        });
        const [aRes, allRes, eRes] = await Promise.all([
          fetch(`/api/articles/filtered?${esQuery.toString()}`),
          fetch(`/api/articles/filtered?${allQuery.toString()}`),
          fetch(`/api/editions/${editionId}`),
        ]);
        const aData = await aRes.json();
        const allData = await allRes.json();
        setArticles(aData.articles || []);
        setTotalCount((allData.articles || []).length);
        if (eRes.ok) setEdition(await eRes.json());
      } catch (error) {
        console.error("Error cargando artículos en español:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [editionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  const editionLabel = edition?.number ? `ila ${edition.number}` : "ila";
  const editionTitle =
    edition && (locale === "es" && edition.titleES ? edition.titleES : edition.title);

  const translatedCount = articles.length;
  const pending = Math.max(0, totalCount - translatedCount);

  const backLink = (
    <Link
      href={`/${locale}/editions/${editionId}`}
      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#BD0E0D] hover:text-[#a50c0b] transition-colors group whitespace-nowrap"
    >
      <span className="group-hover:-translate-x-1 transition-transform">←</span>
      <span className="border-b border-transparent group-hover:border-[#BD0E0D] transition-all">
        {isDe ? "Zum Dossier" : "Al dossier"}
      </span>
    </Link>
  );

  return (
    <>
      <div
        className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 z-40 bg-white dark:bg-gray-900"
        style={{ position: "sticky", top: headerHeight - 1 }}
      >
        <QuietSectionHeader
          variant="chip"
          title={`${editionLabel} · ${isDe ? "auf Spanisch" : "en español"}`}
          rightElement={backLink}
          className="px-4 sm:px-6 lg:px-8 pt-3 mb-0"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {editionTitle && (
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            {editionTitle}
          </p>
        )}

        {translatedCount === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              {isDe
                ? "Noch keine Beiträge dieses Dossiers auf Spanisch verfügbar."
                : "Todavía no hay artículos de este dossier disponibles en español."}
            </p>
          </div>
        ) : (
          <ArticleList articlesProp={articles} />
        )}

        {/* Progreso de traducción + llamada al apoyo (estética banner de donación) */}
        {pending > 0 && (
          <TranslationSupportBanner
            translatedCount={translatedCount}
            totalCount={totalCount}
            isDe={isDe}
          />
        )}
      </div>
    </>
  );
}

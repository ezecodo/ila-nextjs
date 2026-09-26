"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ArticleList from "../../../components/Articles/ArticleList";
import IlaLoader from "../../../components/IlaLoader/IlaLoader";
import QuietSectionHeader from "../../../components/SectionsHeader/QuietSectionHeader";
import TranslationSupportBanner from "../../../components/TranslationSupportBanner/TranslationSupportBanner";

export default function EditionSpanishArticlesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("editionEs");
  const editionId = params.id;
  const isDe = locale === "de";

  const [articles, setArticles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [edition, setEdition] = useState(null);
  const [loading, setLoading] = useState(true);
  // Dossiers vecinos (anterior/posterior) con al menos un artículo en español
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });
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

  useEffect(() => {
    setNeighbors({ prev: null, next: null });
    fetch(`/api/editions/${editionId}/es-neighbors`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setNeighbors({ prev: data.prev, next: data.next }))
      .catch((error) => console.error("Error cargando dossiers vecinos:", error));
  }, [editionId]);

  // ← / → del teclado navegan entre dossiers (salvo que se esté escribiendo en un campo)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable) return;
      const target =
        e.key === "ArrowLeft" ? neighbors.prev : e.key === "ArrowRight" ? neighbors.next : null;
      if (target) router.push(`/${locale}/editions/${target.id}/es`);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [neighbors, locale, router]);

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

  // Subtítulo: en ES solo si hay traducción (un subtítulo en alemán sobre la página en español queda raro)
  const editionSubtitle =
    edition && (locale === "es" ? edition.subtitleES : edition.subtitle);
  const editionDate = edition?.datePublished
    ? new Date(edition.datePublished).toLocaleDateString(isDe ? "de-DE" : "es-ES", {
        month: "long",
        year: "numeric",
      })
    : null;

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

  const navArrow = (neighbor, direction) => {
    const Icon = direction === "prev" ? FaChevronLeft : FaChevronRight;
    const margin = direction === "prev" ? "mr-1" : "ml-1";
    const base = `${margin} shrink-0 inline-flex items-center justify-center w-8 self-stretch border-2 transition-colors`;
    if (!neighbor) {
      const label = direction === "prev" ? t("noPrevDossier") : t("noNextDossier");
      return (
        <span
          aria-disabled="true"
          title={label}
          className={`${base} border-gray-200 text-gray-300 dark:border-gray-700 dark:text-gray-600 cursor-not-allowed`}
        >
          <Icon className="w-3 h-3" aria-hidden="true" />
          <span className="sr-only">{label}</span>
        </span>
      );
    }
    const detail = t("neighborLabel", { number: neighbor.number, count: neighbor.esCount });
    const label = `${direction === "prev" ? t("prevDossier") : t("nextDossier")}: ${detail}`;
    return (
      <Link
        href={`/${locale}/editions/${neighbor.id}/es`}
        title={detail}
        aria-label={label}
        className={`${base} border-[#BD0E0D] text-[#BD0E0D] hover:bg-[#BD0E0D] hover:text-white`}
      >
        <Icon className="w-3 h-3" aria-hidden="true" />
      </Link>
    );
  };

  return (
    <>
      <div
        className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 z-40 bg-white dark:bg-gray-900"
        style={{ position: "sticky", top: headerHeight - 1 }}
      >
        <QuietSectionHeader
          variant="chip"
          titleBefore={navArrow(neighbors.prev, "prev")}
          titleAfter={navArrow(neighbors.next, "next")}
          title={`${editionLabel} · ${isDe ? "auf Spanisch" : "en español"}`}
          rightElement={backLink}
          className="px-4 sm:px-6 lg:px-8 pt-3 mb-0"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {edition && (
          <div className="mb-10 flex items-end gap-5 sm:gap-7 border-b border-gray-200 dark:border-gray-700 pb-6">
            {edition.coverImage && (
              <Link
                href={`/${locale}/editions/${editionId}`}
                className="group shrink-0 w-20 sm:w-28 bg-white p-[3px] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-rotate-2 hover:scale-[1.03]"
                aria-label={t("toDossier", { number: edition.number })}
              >
                <Image
                  src={edition.coverImage}
                  alt={`ila ${edition.number}`}
                  width={224}
                  height={299}
                  className="w-full h-auto object-cover"
                />
              </Link>
            )}
            <div className="min-w-0">
              <p className="mb-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#BD0E0D]">
                {t("dossierKicker", { number: edition.number })}
                {editionDate && (
                  <span className="text-gray-400 dark:text-gray-500"> · {editionDate}</span>
                )}
              </p>
              {editionTitle && (
                <h1 className="font-oswald text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.02] text-[#2b2b2b] dark:text-gray-100 text-balance">
                  {editionTitle}
                </h1>
              )}
              <span aria-hidden="true" className="mt-3 block h-[3px] w-16 bg-[#BD0E0D]" />
              {editionSubtitle && (
                <p className="mt-3 max-w-2xl text-[15px] sm:text-base leading-relaxed text-gray-600 dark:text-gray-400 text-balance">
                  {editionSubtitle}
                </p>
              )}
              {translatedCount > 0 && (
                <p className="mt-2 text-[13px] text-gray-500 dark:text-gray-400">
                  {t("esCountLine", { count: translatedCount, total: totalCount })}
                </p>
              )}
            </div>
          </div>
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

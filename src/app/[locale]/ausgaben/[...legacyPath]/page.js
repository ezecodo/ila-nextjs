"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import Image from "next/image";
import ImageModal from "../../components/ImageModal/ImageModal";
import Link from "next/link";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import HoverInfo from "../../components/HoverInfo/HoverInfo";
import EntityBadges from "../../components/EntityBadges/EntityBadges";
import DonationPopUp from "../../components/DonationPopUp/DonationPopUp";
import DonationInlineBanner from "../../components/DonationInlineBanner/DonationInlineBanner";
import ArticleDossierCTA from "../../components/ArticleDossierCTA/ArticleDossierCTA";
import RelatedArticles from "../../components/RelatedArticles/RelatedArticles";
import ReadingMode from "../../components/ReadingMode/ReadingMode";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import ShareBar from "../../components/ShareBar/ShareBar";
import { useTranslations } from "next-intl";
function normalizeContentForRender(text) {
  if (!text) return "";

  // Si ya tiene etiquetas HTML, no hacemos nada
  if (/<\/?(p|h[1-6]|br|strong|em)(\s|>)/i.test(text)) {
    return text;
  }

  // Dividir por saltos de línea dobles o simples
  const paragraphs = text
    .split(/\n+/) // uno o más saltos
    .map((p) => p.trim())
    .filter(Boolean);

  // Reconstruir en <p>
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

export default function LegacyArticlePage() {
  const t = useTranslations("article");
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const locale = useLocale();
  const isES = locale === "es";

  const { legacyPath } = useParams();
  const fullPath = `/ausgaben/${legacyPath.join("/")}`;

  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);
  const [hoveredEdition, setHoveredEdition] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState({
    url: null,
    alt: "",
    title: "",
  });
  const [hasPdfAbo, setHasPdfAbo] = useState(false);
  const [readerOpen, setReaderOpen] = useState(false);

  useEffect(() => {
    let aborted = false;
    fetch("/api/user/pdf-abo")
      .then((r) => r.json())
      .then((d) => {
        if (!aborted) setHasPdfAbo(!!d?.hasPdfAbo);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, []);

  const openPopup = (image) => {
    setPopupImage({
      url: image.url,
      alt: (isES && image.altES) || image.alt || "Imagen del artículo",
      title:
        (isES && image.titleES) || image.title || "Vista previa de la imagen",
    });
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setPopupImage({ url: null, alt: "", title: "" });
  };

  useEffect(() => {
    async function fetchArticle() {
      try {
        const res = await fetch(
          `/api/articles/by-legacy-path?path=${encodeURIComponent(fullPath)}`,
        );
        if (!res.ok) throw new Error("Artículo no encontrado");
        const data = await res.json();
        console.log("🟢 Article recibido:", data); // 👈 DEBUG
        setArticle(data);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchArticle();
  }, [fullPath]);

  if (error) return <p className="text-red-500">{t("notFound")}</p>;
  // URL canónica para JSON-LD
  const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL}${fullPath}`;
  if (!article) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }
  function formatDate(dateString, locale) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const localeCode = locale === "es" ? "es-ES" : "de-DE";
    return new Date(dateString).toLocaleDateString(localeCode, options);
  }
  function autoFormatHeadings(html) {
    if (!html) return "";

    // Solo transformar si NO hay otros estilos además de <strong>
    return html.replace(
      /<p>\s*<strong>([^<>{}]{3,80})<\/strong>\s*<\/p>/gi,
      (m, inner) => {
        // Heurística: si es cortito y parece un subtítulo, h3
        const isHeadingLike =
          inner.length > 0 &&
          inner.length < 120 &&
          /^[A-ZÄÖÜÑÁÉÍÓÚ]/.test(inner) &&
          !/[.!?]$/.test(inner);

        return isHeadingLike ? `<h3>${inner}</h3>` : m;
      },
    );
  }
  function normalizeContentForRender(html) {
    if (!html) return "";
    return html;
  }
  function autoDetectHeadings(html) {
    if (!html) return "";
    const hasH4 = /<h4\b/i.test(html);
    return html.replace(/<p>([\s\S]*?)<\/p>/gi, (m, inner) => {
      const text = inner
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      const isShort = text.length > 0 && text.length <= 140;
      const startsWithUpper = /^[""'\(\[]?[A-ZÄÖÜÑÁÉÍÓÚ]/.test(text);
      const endsAsHeading = /[?!:]\s*$/.test(text) || !/[.!?]$/.test(text);
      const looksLikeQuestion = /\?\s*$/.test(text);
      const fewSentences = (text.match(/[.!?]/g) || []).length <= 1;
      if (looksLikeQuestion && isShort) return `<h4>${text}</h4>`;
      if (isShort && startsWithUpper && endsAsHeading && fewSentences) return `<h3>${text}</h3>`;
      return m;
    });
  }
  function wrapInlineImagesWithCaption(html) {
    if (!html) return "";
    return html.replace(/<img([^>]+)>/gi, (match, attrs) => {
      const altMatch   = attrs.match(/alt="([^"]*)"/);
      const titleMatch = attrs.match(/title="([^"]*)"/);
      const alignMatch = attrs.match(/data-align="([^"]*)"/);
      const caption    = (altMatch?.[1]   || "").trim();
      const credit     = (titleMatch?.[1] || "").trim();
      const align      = (alignMatch?.[1] || "").trim();
      const floatClass =
        align === "left"
          ? " inline-image-left"
          : align === "right"
            ? " inline-image-right"
            : "";
      if (!caption && !credit && !floatClass) return match;
      // En figura flotada el ancho va en el <figure> (la imagen interna = 100%).
      const w = attrs.match(/width:\s*(\d+)%/)?.[1];
      const figStyle = floatClass && w ? ` style="width:${w}%"` : "";
      const figcaptionContent = caption && credit
        ? `${caption}<span class="image-credit"> · ${credit}</span>`
        : caption || credit;
      const figcap = caption || credit
        ? `<figcaption>${figcaptionContent}</figcaption>`
        : "";
      return `<figure class="inline-image-figure${floatClass}"${figStyle}>${match}${figcap}</figure>`;
    });
  }
  function rewriteEditionLinksWithLocale(html, locale) {
    if (!html) return "";

    // 1) Links con marcador explícito: <a data-ila="edition" data-id="123" href="/editions/123">
    html = html.replace(
      /<a([^>]*\sdata-ila="edition"[^>]*)\s+href="\/?editions\/(\d+)"([^>]*)>/gi,
      (m, pre, id, post) => `<a${pre} href="/${locale}/editions/${id}"${post}>`,
    );

    // 2) Cualquier href relativo tipo /editions/123
    html = html.replace(
      /href="\/editions\/(\d+)"/gi,
      (_, id) => `href="/${locale}/editions/${id}"`,
    );

    // 3) Reparar los casos rotos tipo https://de/editions/123 o https://es/editions/123
    html = html.replace(
      /href="https?:\/\/(de|es)\/editions\/(\d+)"/gi,
      (_, __, id) => `href="/${locale}/editions/${id}"`,
    );

    // 4) Reparar cualquier host absoluto (localhost, vercel, hetzner, etc.)
    html = html.replace(
      /href="https?:\/\/[^"]*\/editions\/(\d+)"/gi,
      (_, id) => `href="/${locale}/editions/${id}"`,
    );

    return html;
  }

  // Parte el HTML en 2 mitades por cantidad de </p>, para insertar el banner inline.
  // Devuelve splitWorked=false si hay menos de 4 párrafos (artículo muy corto).
  function splitHtmlAtMiddleParagraph(html) {
    if (!html) return { firstHalf: "", secondHalf: "", splitWorked: false };
    const closings = [];
    const re = /<\/p>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      closings.push(m.index + m[0].length);
    }
    if (closings.length < 4) {
      return { firstHalf: html, secondHalf: "", splitWorked: false };
    }
    const splitPos = closings[Math.floor(closings.length / 2) - 1];
    return {
      firstHalf: html.slice(0, splitPos),
      secondHalf: html.slice(splitPos),
      splitWorked: true,
    };
  }

  // HTML del artículo ya transformado (headings, imágenes, links).
  // Se computa una vez y se reusa tanto en el render normal como en el Modo lectura.
  const articleHtml = wrapInlineImagesWithCaption(
    rewriteEditionLinksWithLocale(
      autoDetectHeadings(
        autoFormatHeadings(
          normalizeContentForRender(
            isES && article.contentES ? article.contentES : article.content,
          ),
        ),
      ),
      locale,
    ),
  );

  const readerTitle =
    isES && article.isTranslatedES ? article.titleES : article.title;
  const readerSubtitle = isES ? article.subtitleES : article.subtitle;
  const readerAuthor = article.authors?.map((a) => a.name).join(", ");
  const readerMeta = article.edition?.number
    ? `ila ${article.edition.number}`
    : "";
  const readerVorspann = (isES ? article.previewTextES : article.previewText)
    ? rewriteEditionLinksWithLocale(
        isES && article.previewTextES
          ? article.previewTextES
          : article.previewText,
        locale,
      )
    : "";

  return (
    <>
      {/* JSON-LD structured data */}
      {/* JSON-LD estructurado para Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": `${canonicalUrl}#article`,

            headline:
              isES && article.isTranslatedES ? article.titleES : article.title,
            description: (() => {
              const fallback = isES
                ? "Artículo publicado en ILA – Revista sobre América Latina."
                : "Artikel erschienen in ILA – Das Lateinamerika-Magazin.";
              return (
                (isES && article.isTranslatedES
                  ? article.subtitleES || article.previewTextES
                  : article.subtitle || article.previewText) || fallback
              );
            })(),

            url: canonicalUrl,
            mainEntityOfPage: canonicalUrl,

            image: article.images?.length
              ? [article.images[0].url, ...article.images.map((i) => i.url)]
              : [`${process.env.NEXT_PUBLIC_APP_URL}/ila-logo.png`],

            datePublished: article.publicationDate,
            dateModified: article.updatedAt,

            author: article.authors.map((a) => ({
              "@type": "Person",
              name: a.name,
              url: a.id
                ? `${process.env.NEXT_PUBLIC_APP_URL}/authors/${a.id}`
                : process.env.NEXT_PUBLIC_APP_URL,
            })),

            publisher: {
              "@type": "Organization",
              "@id": `${process.env.NEXT_PUBLIC_APP_URL}/#organization`,
              name: "ILA – Das Lateinamerika-Magazin",
              logo: {
                "@type": "ImageObject",
                url: `${process.env.NEXT_PUBLIC_APP_URL}/ila-logo.png`,
                width: 196,
                height: 196,
              },
            },

            inLanguage: locale,
            articleBody:
              isES && article.isTranslatedES
                ? article.contentES
                : article.content,
          }),
        }}
      />

      <main className="max-w-4xl lg:max-w-7xl mx-auto lg:mr-0 px-4 py-6 md:px-6">
        {!isAdmin && <DonationPopUp articleId={article.id} />}

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:items-start">
        <article itemScope itemType="https://schema.org/Article">
          <div className="max-w-3xl mx-auto lg:ml-auto lg:mr-0">
            <div id="article-start" />
            {/* Acceso anticipado Digital ABO */}
            {article.exclusivePreview && (
              <div className="mb-4 flex items-start gap-2 border-l-4 border-[#BD0E0D] bg-[#BD0E0D]/5 px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                <span aria-hidden="true">📰</span>
                <span>
                  {article.publicationDate
                    ? t("exclusivePreviewBadge", {
                        date: formatDate(article.publicationDate, locale),
                      })
                    : t("exclusivePreviewBadgeNoDate")}
                </span>
              </div>
            )}
            {/* FECHA */}
            <p className="text-sm text-gray-400 italic mb-2">
              {formatDate(article.publicationDate, locale)}
            </p>

            {/* TITULO */}
            <h1
              className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 dark:text-white mb-4 break-words"
              itemProp="headline"
            >
              {isES && article.isTranslatedES ? article.titleES : article.title}
            </h1>
            {/* 🔁 Aviso: versión original disponible en alemán */}
            {/* 🔁 Aviso: versión original disponible en alemán */}
            {isES && article.isTranslatedES && (
              <div className="text-right mb-3">
                <Link
                  href={`/de${fullPath}`}
                  className="text-sm text-blue-700 underline font-medium"
                >
                  Original auf Deutsch verfügbar →
                </Link>
              </div>
            )}
            {/* 🔁 Hinweis: Artikel ist auch auf Spanisch verfügbar */}
            {!isES && article.isTranslatedES && (
              <div className="text-right mb-3">
                <Link
                  href={`/es${fullPath}`}
                  className="text-sm text-blue-700 underline font-medium"
                >
                  También disponible en español →
                </Link>
              </div>
            )}

            {/* SUBTITULO */}
            {(isES ? article.subtitleES : article.subtitle) && (
              <h2 className="text-lg md:text-xl font-light italic text-gray-600 dark:text-gray-300 mb-8">
                {isES ? article.subtitleES : article.subtitle}
              </h2>
            )}

            {/* Modo lectura — solo para suscriptores con Digital ABO */}
            {hasPdfAbo && (
              <button
                onClick={() => setReaderOpen(true)}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 text-sm font-semibold text-[#BD0E0D] border border-[#BD0E0D] hover:bg-[#BD0E0D] hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {t("readingMode")}
              </button>
            )}
          </div>

          {/* VORSPANN / STANDFIRST */}
          {(isES ? article.previewTextES : article.previewText) && (
            <div className="mt-3 md:mt-4 mb-6 md:mb-6 border-l-4 border-red-600/80 pl-4 md:pl-5">
              <div
                className="article-content text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{
                  __html: rewriteEditionLinksWithLocale(
                    isES && article.previewTextES
                      ? article.previewTextES
                      : article.previewText,
                    locale,
                  ),
                }}
              />
            </div>
          )}

          {isAdmin && isES && article.isTranslatedES && (
            <div className="text-center mb-6">
              <Link href={`/dashboard/articles/translate/${article.id}`}>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Editar traducción
                </button>
              </Link>
            </div>
          )}

          {article.images?.length > 0 && (
            <div className="flex flex-col items-center mb-6 gap-2">
              {article.images.map((image) => (
                <div key={image.id} className="w-full max-w-3xl">
                  <div
                    className="cursor-pointer overflow-hidden shadow-md"
                    onClick={() => openPopup(image)}
                  >
                    <div className="relative w-full aspect-[3/2]">
                      <Image
                        src={image.url}
                        alt={
                          (isES && image.altES) ||
                          image.alt ||
                          "Imagen del artículo"
                        }
                        fill
                        className="object-cover"
                        sizes="(max-width: 800px) 100vw, 768px"
                      />
                    </div>
                  </div>

                  {/* Título y autor de la foto */}
                  {/* Información de la imagen */}
                  <div className="text-center mt-3">
                    {/* Título accesible solo para screen readers */}
                    {((isES && image.titleES) || image.title) && (
                      <span className="sr-only">
                        {(isES && image.titleES) || image.title}
                      </span>
                    )}

                    {/* Créditos visibles */}
                    {((isES && image.altES) || image.alt) && (
                      <p className="text-sm italic text-gray-600">
                        {(isES && image.altES) || image.alt}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <EntityBadges
              categories={article.categories}
              regions={article.regions}
              topics={article.topics}
              locale={locale}
            />
          </div>
          {/* Tipo de artículo - discreto */}
          {article.beitragstyp && (
            <div className="mb-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
                {locale === "es" && article.beitragstyp.nameES
                  ? article.beitragstyp.nameES
                  : article.beitragstyp.name}
                {article.beitragssubtyp && (
                  <>
                    <span className="mx-1.5">→</span>
                    {locale === "es" && article.beitragssubtyp.nameES
                      ? article.beitragssubtyp.nameES
                      : article.beitragssubtyp.name}
                  </>
                )}
              </p>
              {/* 📚 Título del libro si es Buchbesprechung */}
              {article.mediaTitle &&
                article.beitragstyp.name === "Buchbesprechung" && (
                  <p className="text-sm italic text-gray-600 dark:text-gray-300 mt-1">
                    {article.mediaTitle}
                  </p>
                )}
            </div>
          )}

          {/* 📄 PDFs ADJUNTOS */}
          {article.pdfs?.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs uppercase tracking-wide text-gray-500 font-medium mb-3">
                {t("pdfSectionTitle")}
              </p>
              <div className="flex flex-col gap-2">
                {article.pdfs.map((pdf) => (
                  <a
                    key={pdf.id}
                    href={pdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm self-start"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 16l-5-5 1.41-1.41L11 13.17V4h2v9.17l2.59-2.58L17 11l-5 5zm-7 3h14v2H5v-2z"/>
                    </svg>
                    {pdf.title} — {t("pdfDownload")}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-700 dark:text-gray-300">
            {/* EDICIÓN */}
            {article.edition && article.edition.id && (
              <div>
                {locale === "es" ? (
                  <>
                    Aparece en{" "}
                    <HoverInfo
                      id={article.edition.id}
                      name={
                        <Link
                          href={`/editions/${article.edition.id}`}
                          className="inline-flex items-center gap-1 font-bold no-underline hover:underline"
                          onMouseEnter={(e) => {
                            setHoveredEdition(article.edition.coverImage);
                            setHoverPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setHoverPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredEdition(null)}
                        >
                          <span className="text-red-700 font-semibold">
                            ila {article.edition.number}
                          </span>
                          <span className="ml-1 text-black dark:text-white">
                            {isES && article.edition.titleES
                              ? article.edition.titleES
                              : article.edition.title}
                          </span>
                        </Link>
                      }
                      entityType="editions"
                    />
                  </>
                ) : (
                  <>
                    Erschienen in{" "}
                    <HoverInfo
                      id={article.edition.id}
                      name={
                        <Link
                          href={`/editions/${article.edition.id}`}
                          className="inline-flex items-center gap-1 font-bold no-underline hover:underline"
                          onMouseEnter={(e) => {
                            setHoveredEdition(article.edition.coverImage);
                            setHoverPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setHoverPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredEdition(null)}
                        >
                          <span className="text-red-700 font-semibold">
                            ila {article.edition.number}
                          </span>
                          <span className="ml-1 text-black dark:text-white">
                            {article.edition.title}
                          </span>
                        </Link>
                      }
                      entityType="editions"
                    />
                  </>
                )}
              </div>
            )}

            {/* AUTOR */}
            {/* AUTOR / ENTREVISTA */}
            {/* AUTOR / ENTREVISTA */}
            {/* AUTOR / ENTREVISTA */}
            {article.authors?.length > 0 && (
              <div
                className="mt-2 sm:mt-0"
                itemProp="author"
                itemScope
                itemType="https://schema.org/Person"
              >
                {article.beitragstyp &&
                article.beitragstyp.name.toLowerCase() === "interview" &&
                article.interviewees?.length > 0 ? (
                  <>
                    <span className="text-gray-500 mr-1">
                      {locale === "de" ? "Interview von:" : "Entrevista de:"}
                    </span>
                    {article.authors.map((author, i) => (
                      <span key={author.id}>
                        <HoverInfo
                          id={author.id}
                          name={
                            <Link
                              href={`/authors/${author.id}`}
                              className="text-blue-600 hover:underline font-medium not-italic"
                            >
                              <span itemProp="name">{author.name}</span>
                            </Link>
                          }
                          entityType="authors"
                        />
                        {i < article.authors.length - 1 && <span>,&nbsp;</span>}
                      </span>
                    ))}
                    <span className="ml-1">
                      {locale === "de" ? "mit" : "con"}
                    </span>{" "}
                    {article.interviewees?.map((int, i) => (
                      <span
                        key={int.id}
                        className="font-medium not-italic text-gray-800 dark:text-gray-200"
                      >
                        {int.name}
                        {i < article.interviewees.length - 1 && (
                          <span>,&nbsp;</span>
                        )}
                      </span>
                    ))}
                  </>
                ) : (
                  <>
                    {locale === "de" && (
                      <span className="text-gray-500 mr-1">Von:</span>
                    )}
                    {article.authors.map((author, i) => (
                      <span key={author.id}>
                        <HoverInfo
                          id={author.id}
                          name={
                            <Link
                              href={`/authors/${author.id}`}
                              className="text-blue-600 hover:underline font-medium not-italic"
                            >
                              <span itemProp="name">{author.name}</span>
                            </Link>
                          }
                          entityType="authors"
                        />
                        {i < article.authors.length - 1 && <span>,&nbsp;</span>}
                      </span>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          {(() => {
            const fullHtml = articleHtml;
            const { firstHalf, secondHalf, splitWorked } =
              splitHtmlAtMiddleParagraph(fullHtml);
            if (!splitWorked) {
              return (
                <div
                  className="article-content text-gray-700 dark:text-gray-200"
                  itemProp="articleBody"
                  dangerouslySetInnerHTML={{ __html: fullHtml }}
                />
              );
            }
            return (
              <div
                className="article-content text-gray-700 dark:text-gray-200"
                itemProp="articleBody"
              >
                <div dangerouslySetInnerHTML={{ __html: firstHalf }} />
                <DonationInlineBanner />
                <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
              </div>
            );
          })()}
          {((isES && article.additionalInfoES) || article.additionalInfo) && (
            <div className="mt-8 mb-6 p-5 bg-gray-50 dark:bg-gray-800 border-l-4 border-red-600 rounded-r-lg shadow-sm">
              <div
                className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:hover:underline"
                dangerouslySetInnerHTML={{
                  __html: rewriteEditionLinksWithLocale(
                    isES && article.additionalInfoES
                      ? article.additionalInfoES
                      : article.additionalInfo,
                    locale,
                  ),
                }}
              />
            </div>
          )}
          {/* 👇 Créditos de traducción al final del artículo */}

          {isES && article.isTranslatedES && (
            <p className="text-sm text-gray-500 italic mt-10 text-right">
              Traducción realizada con la ayuda de DeepL
              {article.translator && (
                <> y editada por {article.translator.name}</>
              )}
            </p>
          )}

          {article.edition?.id && (
            <ArticleDossierCTA
              edition={article.edition}
              currentArticleId={article.id}
            />
          )}
        </article>

          <RelatedArticles articleId={article.id} />
        </div>

        <ImageModal
          isOpen={isOpen}
          imageUrl={popupImage.url}
          onClose={closePopup}
          alt={popupImage.alt}
          title={popupImage.title}
        />

        <ReadingMode
          open={readerOpen}
          onClose={() => setReaderOpen(false)}
          html={articleHtml}
          vorspann={readerVorspann}
          title={readerTitle}
          subtitle={readerSubtitle}
          author={readerAuthor}
          meta={readerMeta}
        />
        {hoveredEdition && (
          <div
            className="fixed z-50 pointer-events-none bg-white border shadow-lg rounded-lg flex items-center justify-center"
            style={{
              left: `${hoverPosition.x + 10}px`,
              top: `${hoverPosition.y - 260}px`,
              width: "300px",
              height: "400px",
              padding: "8px",
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={hoveredEdition}
                alt="Portada de la edición"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        <ShareBar
          title={isES ? article.titleES : article.title}
          articleId={article.id} // 👈 habilita el botón de favoritos
          anchorSelector="#article-start" // 👈 alinear con el inicio del contenido
          contentMaxWidth={1280} // max-w-7xl (grid con rail derecho)
          gapFromContent={48}
          align="right" // el bloque va pegado al margen derecho en desktop
        />
      </main>
    </>
  );
}

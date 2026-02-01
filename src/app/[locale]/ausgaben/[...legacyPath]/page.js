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
  // ✅ Función auxiliar para detectar títulos en párrafos normales
  function autoDetectHeadings(html) {
    if (!html) return "";

    // ✅ Si ya hay h4 tags, no los detectes automáticamente
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

      // ✅ Solo convertir a h4 si NO hay h4 previos (ya los puso el script)
      if (!hasH4 && looksLikeQuestion && isShort) {
        return `<h4>${text}</h4>`;
      }

      if (isShort && startsWithUpper && endsAsHeading && fewSentences) {
        return `<h3>${text}</h3>`;
      }

      return m;
    });
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

      <main className="max-w-4xl mx-auto p-6">
        {!isAdmin && <DonationPopUp articleId={article.id} />}

        <article itemScope itemType="https://schema.org/Article">
          <div className="max-w-3xl mx-auto">
            <div id="article-start" />
            {/* FECHA */}
            <p className="text-sm text-gray-400 italic mb-2">
              {formatDate(article.publicationDate, locale)}
            </p>

            {/* TITULO */}
            <h1
              className="text-4xl md:text-5xl font-serif font-bold leading-tight text-gray-900 dark:text-white mb-4 break-words"
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
          </div>

          {/* VORSPANN / STANDFIRST */}
          {(isES ? article.previewTextES : article.previewText) && (
            <div className="mt-3 md:mt-4 mb-6 md:mb-6 border-l-4 border-red-600/80 pl-4 md:pl-5">
              <div
                className="article-content font-serif text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200"
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
                    className="cursor-pointer rounded-lg shadow-md"
                    onClick={() => openPopup(image)}
                  >
                    <div className="relative w-full max-w-[500px] mx-auto aspect-[4/3]">
                      <Image
                        src={image.url}
                        alt={
                          (isES && image.altES) ||
                          image.alt ||
                          "Imagen del artículo"
                        }
                        fill
                        className="object-contain rounded"
                        sizes="(max-width: 800px) 100vw, 800px"
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
          <div
            className="article-content text-gray-700 dark:text-gray-200"
            itemProp="articleBody"
            dangerouslySetInnerHTML={{
              __html: rewriteEditionLinksWithLocale(
                autoDetectHeadings(
                  autoFormatHeadings(
                    normalizeContentForRender(
                      isES && article.contentES
                        ? article.contentES
                        : article.content,
                    ),
                  ),
                ),
                locale,
              ),
            }}
          />
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
        </article>

        <ImageModal
          isOpen={isOpen}
          imageUrl={popupImage.url}
          onClose={closePopup}
          alt={popupImage.alt}
          title={popupImage.title}
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
          contentMaxWidth={1024} // max-w-4xl
          gapFromContent={16}
        />
      </main>
    </>
  );
}

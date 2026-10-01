"use client";

import EntityBadges from "../EntityBadges/EntityBadges";
import { articleTransforms, renderArticleBody } from "@/lib/articleRender";

// Vorschau del artículo COMPLETO tal como sale en la web — la usa el publilab
// (botón "Vorschau"). Marco y clases calcados de la página pública
// (ausgaben/[...legacyPath]/page.js): columna max-w-3xl con la de artículos
// relacionados (320px) a la derecha, fecha, título, subtítulo, Vorspann con
// filete rojo, imágenes, temas, tipo, edición, autor·in, cuerpo y Zusatzinfo.
// El cuerpo pasa por el MISMO formateo que la web (src/lib/articleRender.js,
// variante "ausgaben" si va en un Dossier, "online" si no).
//
// Si cambia el marco de la página pública, actualizar acá también (el
// formateo del cuerpo ya es compartido; el marco de alrededor todavía no).
// Sin interacción (links/hover/popup): es para ver, no para navegar.
//
// Props (todas opcionales salvo bodyHtml):
//   bodyHtml, locale, variant ("ausgaben" | "online"), date, title, subtitle,
//   vorspannHtml, additionalInfoHtml, beitragstyp, beitragssubtyp,
//   edition { number, title }, authors [nombre], interviewees [nombre],
//   regions/topics/categories [{ id, name }], images [{ url, alt, title }],
//   mediaTitle (Buchbesprechung).
export default function ArticlePreview({
  bodyHtml,
  locale = "de",
  variant = "ausgaben",
  date,
  title,
  subtitle,
  vorspannHtml,
  additionalInfoHtml,
  beitragstyp,
  beitragssubtyp,
  edition,
  authors = [],
  interviewees = [],
  regions = [],
  topics = [],
  categories = [],
  images = [],
  mediaTitle,
}) {
  const { rewriteEditionLinksWithLocale } = articleTransforms(variant);
  const html = renderArticleBody(bodyHtml || "", locale, variant);
  const hasText = (h) => !!(h || "").replace(/<[^>]+>/g, "").trim();

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString(locale === "es" ? "es-ES" : "de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Buchbesprechung: la tapa va flotada dentro del Vorspann (igual que la web).
  const isBuchbesprechung = beitragstyp === "Buchbesprechung";
  const bookCoverImage = isBuchbesprechung ? images[0] : null;
  const remainingImages = bookCoverImage ? images.slice(1) : images;
  const isInterview =
    (beitragstyp || "").toLowerCase() === "interview" && interviewees.length > 0;
  const hasVorspann = hasText(vorspannHtml);

  return (
    <main className="max-w-4xl lg:max-w-7xl mx-auto px-4 py-6 md:px-6">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:items-start">
        <article>
          <div className="max-w-3xl mx-auto lg:ml-auto lg:mr-0">
            {/* FECHA */}
            {formatDate(date) && (
              <p className="text-sm text-gray-400 italic mb-2">{formatDate(date)}</p>
            )}

            {/* TITULO */}
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 dark:text-white mb-4 break-words">
              {title || <span className="text-gray-300">Titel</span>}
            </h1>

            {/* SUBTITULO */}
            {subtitle && (
              <h2 className="text-lg md:text-xl font-light italic text-gray-600 dark:text-gray-300 mb-8">
                {subtitle}
              </h2>
            )}
          </div>

          {/* VORSPANN */}
          {(hasVorspann || bookCoverImage) && (
            <div className="mt-3 md:mt-4 mb-6 md:mb-6 border-l-4 border-red-600/80 pl-4 md:pl-5">
              <div className="article-content text-lg md:text-xl leading-relaxed text-gray-800 dark:text-gray-200">
                {bookCoverImage && (
                  <figure
                    className="inline-image-figure inline-image-left"
                    style={{ width: "35%" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bookCoverImage.url}
                      alt={bookCoverImage.alt || "Buchcover"}
                      className="shadow-md"
                    />
                    {bookCoverImage.alt && <figcaption>{bookCoverImage.alt}</figcaption>}
                  </figure>
                )}
                {hasVorspann && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: rewriteEditionLinksWithLocale(vorspannHtml, locale),
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* IMÁGENES (la web: horizontal → recorte 3:2; vertical/cuadrada →
              completa con tope de alto — acá sin medir, se muestra completa
              con el mismo tope, que es lo que pasa con la mayoría de los
              recortes del PDF). */}
          {remainingImages.length > 0 && (
            <div className="flex flex-col items-center mb-6 gap-2">
              {remainingImages.map((image, idx) => (
                <div key={image.url || idx} className="w-full max-w-3xl">
                  <div className="overflow-hidden shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.alt || "Imagen del artículo"}
                      className="w-full mx-auto object-contain"
                      style={{ maxHeight: "80vh" }}
                    />
                  </div>
                  <div className="text-center mt-3">
                    {image.alt && (
                      <p className="text-sm italic text-gray-600">{image.alt}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <EntityBadges
              categories={categories}
              regions={regions}
              topics={topics}
              locale={locale}
            />
          </div>

          {/* Tipo de artículo */}
          {beitragstyp && (
            <div className="mb-2">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">
                {beitragstyp}
                {beitragssubtyp && (
                  <>
                    <span className="mx-1.5">→</span>
                    {beitragssubtyp}
                  </>
                )}
              </p>
              {mediaTitle && isBuchbesprechung && (
                <p className="text-sm italic text-gray-600 dark:text-gray-300 mt-1">
                  {mediaTitle}
                </p>
              )}
            </div>
          )}

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-700 dark:text-gray-300">
            {/* EDICIÓN */}
            {edition?.number && (
              <div>
                {locale === "es" ? "Aparece en " : "Erschienen in "}
                <span className="inline-flex items-center gap-1 font-bold">
                  <span className="text-red-700 font-semibold">ila {edition.number}</span>
                  <span className="ml-1 text-black dark:text-white">{edition.title}</span>
                </span>
              </div>
            )}

            {/* AUTOR / ENTREVISTA */}
            {authors.length > 0 && (
              <div className="mt-2 sm:mt-0">
                {isInterview ? (
                  <>
                    <span className="text-gray-500 mr-1">
                      {locale === "de" ? "Interview von:" : "Entrevista de:"}
                    </span>
                    <span className="text-blue-600 font-medium">{authors.join(", ")}</span>
                    <span className="ml-1">{locale === "de" ? "mit" : "con"}</span>{" "}
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {interviewees.join(", ")}
                    </span>
                  </>
                ) : (
                  <>
                    {locale === "de" && <span className="text-gray-500 mr-1">Von:</span>}
                    <span className="text-blue-600 font-medium">{authors.join(", ")}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* CUERPO */}
          <div
            className={`article-content text-gray-700 dark:text-gray-200${variant === "online" ? " mt-6" : ""}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* ZUSATZINFO */}
          {hasText(additionalInfoHtml) && (
            <div className="mt-8 mb-6 p-5 bg-gray-50 dark:bg-gray-800 border-l-4 border-red-600 rounded-r-lg shadow-sm">
              <div
                className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 [&_p]:mb-2 [&_a]:text-blue-600 [&_a]:hover:underline"
                dangerouslySetInnerHTML={{
                  __html: rewriteEditionLinksWithLocale(additionalInfoHtml, locale),
                }}
              />
            </div>
          )}
        </article>

        {/* Lugar de "artículos relacionados" en la web — vacío, solo para que
            el ancho del texto sea el mismo. */}
        <aside className="hidden lg:block">
          <div className="border border-dashed border-gray-200 px-4 py-6 text-xs text-gray-300 text-center">
            Verwandte Artikel
          </div>
        </aside>
      </div>
    </main>
  );
}

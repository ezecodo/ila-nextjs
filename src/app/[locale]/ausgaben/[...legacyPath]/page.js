"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import Image from "next/image";
import ImageModal from "../../components/ImageModal/ImageModal";
import Link from "next/link";
import HoverInfo from "../../components/HoverInfo/HoverInfo";
import EntityBadges from "../../components/EntityBadges/EntityBadges";
import DonationPopUp from "../../components/DonationPopUp/DonationPopUp";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import ShareBar from "../../components/ShareBar/ShareBar";
import { useTranslations } from "next-intl";

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
      alt: image.alt || "Imagen del artículo",
      title: image.title || "Vista previa de la imagen",
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
          `/api/articles/by-legacy-path?path=${encodeURIComponent(fullPath)}`
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
  if (!article) return <p>{t("loading")}</p>;

  function formatDate(dateString, locale) {
    const options = { year: "numeric", month: "long", day: "numeric" };
    const localeCode = locale === "es" ? "es-ES" : "de-DE";
    return new Date(dateString).toLocaleDateString(localeCode, options);
  }
  function autoFormatHeadings(html) {
    if (!html) return "";

    // Párrafos que solo tienen <strong> → convertirlos en <h2>
    return html.replace(
      /<p>\s*<strong>(.*?)<\/strong>\s*<\/p>/gi,
      "<h2>$1</h2>"
    );
  }
  return (
    <main className="max-w-4xl mx-auto p-6">
      <DonationPopUp articleId={article.id} />

      <article itemScope itemType="https://schema.org/Article">
        <div className="max-w-3xl mx-auto">
          <div id="article-start" />
          {/* FECHA */}
          <p className="text-sm text-gray-400 italic mb-2">
            {formatDate(article.publicationDate, locale)}
          </p>

          {/* TITULO */}
          <h1
            className="text-4xl md:text-5xl font-serif font-bold leading-tight text-gray-900 dark:text-white mb-4"
            itemProp="headline"
          >
            {isES && article.isTranslatedES ? article.titleES : article.title}
          </h1>

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
              className="article-content font-serif text-lg md:text-xl leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{
                __html:
                  isES && article.previewTextES
                    ? article.previewTextES
                    : article.previewText,
              }}
            />
          </div>
        )}
        {/* AUTOR justo debajo del Vorspann */}
        {article.authors?.length > 0 && (
          <div
            className="text-gray-500 italic mb-6 text-right"
            itemProp="author"
            itemScope
            itemType="https://schema.org/Person"
          >
            {article.authors.map((author, i) => (
              <span key={author.id}>
                <HoverInfo
                  id={author.id}
                  name={
                    <Link
                      href={`/authors/${author.id}`}
                      className="hover:underline"
                    >
                      <span itemProp="name">{author.name}</span>
                    </Link>
                  }
                  entityType="authors"
                />
                {i < article.authors.length - 1 && <span>, </span>}
              </span>
            ))}
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
                  <div className="relative w-full max-w-[800px] mx-auto aspect-[4/3]">
                    <Image
                      src={image.url}
                      alt={image.alt || "Imagen del artículo"}
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
                  {image.title && (
                    <span className="sr-only">{image.title}</span>
                  )}

                  {/* Créditos visibles */}
                  {image.alt && (
                    <p className="text-sm italic text-gray-600">{image.alt}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <EntityBadges
            categories={article.categories}
            regions={article.regions}
            topics={article.topics}
            locale={locale}
          />
        </div>

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
          className="article-content text-gray-700 dark:text-gray-200 mt-6"
          itemProp="articleBody"
          dangerouslySetInnerHTML={{
            __html: autoFormatHeadings(
              isES && article.contentES ? article.contentES : article.content
            ),
          }}
        />

        {((isES && article.additionalInfoES) || article.additionalInfo) && (
          <div
            className="article-content mt-6 text-sm text-gray-600 dark:text-gray-400 italic"
            dangerouslySetInnerHTML={{
              __html:
                isES && article.additionalInfoES
                  ? article.additionalInfoES
                  : article.additionalInfo,
            }}
          />
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
  );
}

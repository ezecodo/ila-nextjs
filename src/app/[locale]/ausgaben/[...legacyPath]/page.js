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

  return (
    <main className="max-w-4xl mx-auto p-6">
      <DonationPopUp articleId={article.id} />

      <article itemScope itemType="https://schema.org/Article">
        <div className="max-w-3xl mx-auto">
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
                <div className="text-center mt-3">
                  {image.title && (
                    <p className="text-base font-semibold">{image.title}</p>
                  )}
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

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:gap-6 text-sm text-gray-700 dark:text-gray-300 italic">
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
          {article.authors?.length > 0 && (
            <div
              className="mt-2 sm:mt-0"
              itemProp="author"
              itemScope
              itemType="https://schema.org/Person"
            >
              <span className="text-gray-500 mr-1 not-italic">Von:</span>
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
            </div>
          )}
        </div>
        <div
          className="text-gray-700 dark:text-gray-200 mt-6"
          itemProp="articleBody"
        >
          {(isES ? article.contentES : article.content)
            ? (isES ? article.contentES : article.content)
                .split("\n")
                .filter((line) => line.trim() !== "")
                .map((line, i) => {
                  const trimmed = line.trim();
                  const isSubheading =
                    trimmed.length < 100 &&
                    /^[A-ZÄÖÜ]/.test(trimmed) &&
                    !trimmed.endsWith(".") &&
                    trimmed !== trimmed.toUpperCase();

                  return isSubheading ? (
                    <h3
                      key={i}
                      className="text-xl font-semibold my-6 text-gray-800 dark:text-white"
                    >
                      {trimmed}
                    </h3>
                  ) : (
                    <p key={i} className="mb-4 leading-relaxed">
                      {trimmed}
                    </p>
                  );
                })
            : "Sin contenido"}
        </div>

        {((isES && article.additionalInfoES) || article.additionalInfo) && (
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 italic">
            {isES ? article.additionalInfoES : article.additionalInfo}
          </div>
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

      <ShareBar title={isES ? article.titleES : article.title} />
    </main>
  );
}

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <DonationPopUp articleId={article.id} />

      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 text-center">
        {isES && article.isTranslatedES ? article.titleES : article.title}
      </h1>

      {isAdmin && isES && article.isTranslatedES && (
        <div className="text-center mb-6">
          <Link href={`/dashboard/articles/translate/${article.id}`}>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Editar traducción
            </button>
          </Link>
        </div>
      )}

      {(isES ? article.subtitleES : article.subtitle) && (
        <h2 className="text-xl text-gray-600 dark:text-gray-300 italic mb-6 text-center">
          {isES ? article.subtitleES : article.subtitle}
        </h2>
      )}

      {article.images?.length > 0 && (
        <div className="flex justify-center mb-6">
          {article.images.map((image) => (
            <div
              key={image.id}
              className="relative w-full max-w-md h-64 cursor-pointer"
              onClick={() => openPopup(image)}
            >
              <Image
                src={image.url}
                alt={image.alt || "Imagen del artículo"}
                layout="fill"
                objectFit="contain"
                className="rounded-lg"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <EntityBadges
          categories={article.categories}
          regions={article.regions}
          topics={article.topics}
        />
      </div>

      {article.authors?.length > 0 && (
        <div className="text-gray-700 dark:text-gray-200 flex items-center gap-1 mb-6">
          <span className="font-medium text-base">{t("by")}</span>
          {article.authors.map((author, i) => (
            <span key={author.id}>
              <HoverInfo
                id={author.id}
                name={
                  <Link
                    href={`/authors/${author.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {author.name}
                  </Link>
                }
                entityType="authors"
              />
              {i < article.authors.length - 1 && <span>,&nbsp;</span>}
            </span>
          ))}
        </div>
      )}

      {article.edition && article.edition.id && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-left italic">
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
                    <span
                      className="text-red-700"
                      style={{ fontFamily: "Futura Cyrillic, sans-serif" }}
                    >
                      ila {article.edition.number}
                    </span>
                    <span className="font-semibold text-black dark:text-white ml-1">
                      {article.edition.title}
                    </span>
                  </Link>
                }
                entityType="editions"
              />
            </>
          ) : (
            <>
              Erscheint in{" "}
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
                    <span
                      className="text-red-700"
                      style={{ fontFamily: "Futura Cyrillic, sans-serif" }}
                    >
                      ila {article.edition.number}
                    </span>
                    <span className="font-semibold text-black dark:text-white ml-1">
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

      <div className="text-gray-700 dark:text-gray-200 mt-6">
        {(isES ? article.contentES : article.content)
          ? (isES ? article.contentES : article.content)
              .split("\n")
              .map((line, i) => (
                <p key={i} className="mb-4">
                  {line}
                </p>
              ))
          : "Sin contenido"}
      </div>

      {((isES && article.additionalInfoES) || article.additionalInfo) && (
        <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 italic">
          {isES ? article.additionalInfoES : article.additionalInfo}
        </div>
      )}

      <ImageModal
        isOpen={isOpen}
        imageUrl={popupImage.url}
        onClose={closePopup}
        alt={popupImage.alt}
        title={popupImage.title}
      />

      {hoveredEdition && (
        <div
          className="fixed p-2 bg-white shadow-lg border rounded-lg z-50"
          style={{
            left: `${hoverPosition.x + 10}px`,
            top: `${hoverPosition.y - 260}px`,
            width: "300px",
          }}
        >
          <Image
            src={hoveredEdition}
            alt="Portada de la edición"
            width={300}
            height={350}
            className="rounded-lg"
          />
        </div>
      )}
      <ShareBar title={isES ? article.titleES : article.title} />
    </div>
  );
}

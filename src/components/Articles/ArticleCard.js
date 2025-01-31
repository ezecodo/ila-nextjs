import Image from "next/image";
import styles from "./ArticleCard.module.css";
import ImageModal from "../ImageModal/ImageModal";
import { useState } from "react";
import Link from "next/link";

export default function ArticleCard({ article }) {
  const firstImage = article.images?.[0];
  const isBookCover = firstImage && firstImage.height > firstImage.width;
  const formattedDate = article.publicationDate
    ? new Date(article.publicationDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "numeric",
      })
    : null;
  const [isOpen, setIsOpen] = useState(false);
  const [popupImage, setPopupImage] = useState(null);

  const openPopup = (imageUrl) => {
    setPopupImage(imageUrl);
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
    setPopupImage(null);
  };

  return (
    <div className={styles.articleCard}>
      {/* Imagen */}
      {firstImage && (
        <div
          className={styles.imageContainer}
          onClick={() => openPopup(firstImage.url)}
        >
          <Image
            src={firstImage.url}
            alt={firstImage.alt || "Imagen del artículo"}
            width={300}
            height={200}
            className={isBookCover ? styles.bookCover : styles.articleImage} // Aplica estilo según la proporción
          />
        </div>
      )}

      {/* Contenido */}
      <div className={styles.articleContent}>
        <Link href={`/articles/${article.id}`} className={styles.titleGroup}>
          <div>
            <div className={styles.metadataContainer}>
              {article.regions?.map((region) => (
                <span key={region.id} className={styles.regionBadge}>
                  {region.name}
                </span>
              ))}
              {article.topics?.map((topic) => (
                <span key={topic.id} className={styles.topicBadge}>
                  {topic.name}
                </span>
              ))}
              {formattedDate && (
                <span className={styles.articleDate}>{formattedDate}</span>
              )}
            </div>
            {/* Contenedor para título y fecha en la misma línea */}
            <div className={styles.articleHeader}>
              <h2 className="text-lg font-bold mt-2 mb-2">{article.title}</h2>
            </div>
            {article.subtitle && (
              <h3 className={styles.articleSubtitle}>{article.subtitle}</h3>
            )}
          </div>
        </Link>

        {/* Beitragstyp, Categorías */}
        {article.beitragstyp?.name && (
          <div className={styles.articleMeta}>
            <span>{article.beitragstyp.name}</span>

            {article.categories?.length > 0 && (
              <>
                <span className={styles.separator}>|</span>
                <span>
                  {article.categories.map((cat) => cat.name).join(", ")}
                </span>
              </>
            )}
          </div>
        )}

        {/* Autores */}
        {article.authors?.length > 0 && (
          <p className={styles.articleAuthors}>
            {`Por: ${article.authors.map((author) => author.name).join(", ")}`}
          </p>
        )}
      </div>
      {/* Modal de Imagen */}
      <ImageModal
        isOpen={isOpen}
        imageUrl={popupImage}
        onClose={closePopup}
        alt={firstImage?.alt}
        title={firstImage?.title}
      />
    </div>
  );
}

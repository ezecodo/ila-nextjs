import Image from "next/image";
import styles from "./ArticleCard.module.css";
import ImageModal from "../ImageModal/ImageModal";
import { useState } from "react";

export default function ArticleCard({ article }) {
  const firstImage = article.images?.[0];
  const formattedDate = article.publicationDate
    ? new Date(article.publicationDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })
    : null;
  const [isOpen, setIsOpen] = useState(false); // Controla si el modal está abierto
  const [popupImage, setPopupImage] = useState(null); // Guarda la URL de la imagen seleccionada

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
            className={styles.articleImage}
          />
        </div>
      )}
      {/* Beitragstyp y Fecha */}
      {article.beitragstyp?.name && formattedDate && (
        <div className={styles.articleTypeContainer}>
          <span className={styles.articleType}>{article.beitragstyp.name}</span>
          <span className={styles.separator}>|</span>
          <span className={styles.articleDate}>{formattedDate}</span>
        </div>
      )}

      {/* Contenido */}
      <div className={styles.articleContent}>
        <h2 className={styles.articleTitle}>{article.title}</h2>
        {article.subtitle && (
          <h3 className={styles.articleSubtitle}>{article.subtitle}</h3>
        )}

        {/* Regiones */}
        <div className={styles.badgesContainer}>
          {article.regions?.map((region) => (
            <span key={region.id} className={styles.regionBadge}>
              {region.name}
            </span>
          ))}
        </div>

        {/* Temas */}
        <div className={styles.badgesContainer}>
          {article.topics?.map((topic) => (
            <span key={topic.id} className={styles.topicBadge}>
              {topic.name}
            </span>
          ))}
        </div>
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

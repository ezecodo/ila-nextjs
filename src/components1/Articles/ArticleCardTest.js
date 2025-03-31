"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./ArticleCardTest.module.css"; // Archivo CSS específico para ArticleCardTest

export default function ArticleCardTest({ article, className }) {
  const { title, subtitle, publicationDate, images, authors } = article;

  const formattedDate = publicationDate
    ? new Date(publicationDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "numeric",
      })
    : null;

  return (
    <div className={`${styles.articleCard} ${className || ""}`}>
      {/* Imagen destacada */}
      {images?.[0] && (
        <div className={styles.imageContainer}>
          <Image
            src={images[0].url}
            alt={images[0].alt || "Imagen del artículo"}
            width={300}
            height={200}
            className={styles.articleImage}
          />
        </div>
      )}

      {/* Contenido del artículo */}
      <div className={styles.content}>
        <Link href={`/articles/${article.id}`} className={styles.title}>
          <h2>{title}</h2>
        </Link>

        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

        {formattedDate && <p className={styles.date}>{formattedDate}</p>}

        {authors?.length > 0 && (
          <p className={styles.authors}>
            {`Por: ${authors.map((author) => author.name).join(", ")}`}
          </p>
        )}
      </div>
    </div>
  );
}

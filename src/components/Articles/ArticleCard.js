import Image from "next/image";
import Link from "next/link";
import styles from "./ArticleCard.module.css";

export default function ArticleCard({ article }) {
  const firstImage = article.images?.[0];

  // Función para truncar texto
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  return (
    <div className={styles.articleCard}>
      {/* Imagen del artículo */}
      {firstImage && (
        <Image
          src={firstImage.url}
          alt={firstImage.alt || "Imagen del artículo"}
          width={300}
          height={200}
          className={styles.articleImage}
        />
      )}

      {/* Contenido del artículo */}
      <div className={styles.articleContent}>
        <h2 className={styles.articleTitle}>{article.title}</h2>
        {article.subtitle && (
          <h3 className={styles.articleSubtitle}>{article.subtitle}</h3>
        )}

        {/* Texto de vista previa truncado */}
        {article.previewText && (
          <p className={styles.previewText}>
            {truncateText(article.previewText, 150)}{" "}
            <Link href={`/articles/${article.id}`} className={styles.readMore}>
              Ver más
            </Link>
          </p>
        )}

        {/* Mostrar regiones */}
        <p className={styles.regionBadge}>
          {article.regions?.length > 0
            ? `${article.regions.map((region) => region.name).join(", ")}`
            : "Sin regiones asociadas"}
        </p>

        {article.topics?.length > 0 && (
          <p className={styles.topicBadge}>
            {article.topics.map((topic) => topic.name).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

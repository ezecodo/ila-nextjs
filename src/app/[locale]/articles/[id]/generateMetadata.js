// File: app/[locale]/articles/[id]/generateMetadata.js

import { getArticleById } from "@/lib/api/articles";

export async function generateMetadata({ params }) {
  const article = await getArticleById(parseInt(params.id, 10));

  if (!article) {
    return {
      title: "Artículo no encontrado – ila",
      description: "El artículo solicitado no fue encontrado.",
    };
  }

  // Detectar idioma del locale desde la ruta (params.locale no está aquí)
  // Lo sacamos del pathname si se usa generateMetadata en layout
  const pathname = params?.__nextMetadataRoute__ || ""; // fallback interno de Next.js
  const isES = pathname.startsWith("/es");

  const title = isES && article.titleES ? article.titleES : article.title;
  const description =
    (isES && article.subtitleES) ||
    (isES && article.previewTextES) ||
    article.subtitle ||
    article.previewText ||
    "Artículo publicado en ila.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: article.images?.[0]?.url
        ? [
            {
              url: article.images[0].url,
              width: 1200,
              height: 630,
              alt: article.images[0].alt || "Imagen del artículo",
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.images?.[0]?.url ? [article.images[0].url] : [],
    },
  };
}

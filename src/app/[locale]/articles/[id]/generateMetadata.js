import { getArticleById } from "@/lib/api/articles";

export async function generateMetadata({ params }) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    return {
      title: "Ruta inválida – ila",
      description: "La ruta proporcionada no es válida.",
    };
  }

  const article = await getArticleById(id);

  if (!article) {
    return {
      title: "Artículo no encontrado – ila",
      description: "El artículo solicitado no fue encontrado.",
    };
  }

  const pathname = params?.__nextMetadataRoute__ || "";
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

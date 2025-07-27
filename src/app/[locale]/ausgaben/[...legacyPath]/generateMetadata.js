import { getArticleByLegacyPath } from "@/lib/api/articles";

export async function generateMetadata({ params }) {
  const rawPath = `/ausgaben/${params.legacyPath.join("/")}`;
  const fullPath = encodeURI(rawPath); // ✅ codifica cualquier carácter especial

  const article = await getArticleByLegacyPath(fullPath);

  if (!article) {
    return {
      title: "Artículo no encontrado – ila",
      description: "El artículo solicitado no fue encontrado.",
    };
  }

  const title = article.title || "Artículo – ila";
  const description =
    article.subtitle || article.previewText || "Artículo publicado en ila.";

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

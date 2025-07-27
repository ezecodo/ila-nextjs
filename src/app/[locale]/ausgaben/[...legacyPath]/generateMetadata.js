// app/[locale]/ausgaben/[...legacyPath]/generateMetadata.js
import { getArticleByLegacyPath } from "@/lib/api/articles";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export async function generateMetadata({ params }) {
  const slug = params.legacyPath.join("/");
  const fullPath = `/ausgaben/${slug}`;
  const canonicalUrl = `${SITE_URL}${fullPath}`;

  const article = await getArticleByLegacyPath(fullPath);
  if (!article) {
    return {
      title: "Artículo no encontrado – ila",
      description: "El artículo solicitado no fue encontrado.",
      alternates: { canonical: canonicalUrl },
      robots: { index: false, follow: false },
    };
  }

  const title = article.title;
  const description = article.subtitle || article.previewText || "";

  const imageUrl = article.images?.[0]?.url;
  const ogImages = imageUrl
    ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.images[0].alt || title,
        },
      ]
    : [];

  // Regiones y temas
  const section = article.regions[0]?.name || "";
  const tags = [
    ...article.regions.map((r) => r.name),
    ...article.topics.map((t) => t.name),
  ];

  // Autores
  const authorsMeta = article.authors.map((a) => ({
    name: a.name,
    url: `${SITE_URL}/authors/${a.id}`,
  }));
  const ogAuthors = article.authors.map((a) => `${SITE_URL}/authors/${a.id}`);

  return {
    title,
    description,

    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
    authors: authorsMeta,

    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      siteName: "ILA",
      images: ogImages,
      article: {
        // ← este bloque es el que genera tus tags
        section,
        tags,
        authors: ogAuthors,
      },
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
      creator: authorsMeta[0]?.name,
    },

    other: [{ name: "language", content: params.locale }],
  };
}

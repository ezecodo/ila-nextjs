// app/[locale]/ausgaben/[...legacyPath]/generateMetadata.js
import { getArticleByLegacyPath } from "@/lib/api/articles";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

  const isES = params.locale === "es";

  const title = `${
    isES && article.isTranslatedES ? article.titleES : article.title
  } – ila`;

  const description =
    isES && article.isTranslatedES
      ? article.subtitleES || article.previewTextES || ""
      : article.subtitle || article.previewText || "";

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
    : [
        {
          url: `${SITE_URL}/default-og.png`,
          width: 1200,
          height: 630,
          alt: "ILA",
        },
      ];

  const section = article.regions[0]?.name || "";
  const tags = [
    ...article.regions.map((r) => r.name),
    ...article.topics.map((t) => t.name),
  ];

  const authorsMeta = article.authors.map((a) => ({
    name: a.name,
    url: `${SITE_URL}/authors/${a.id}`,
  }));
  const ogAuthors = article.authors.map((a) => `${SITE_URL}/authors/${a.id}`);

  const keywords = [
    isES && article.isTranslatedES ? article.titleES : article.title,
    ...article.authors.map((a) => a.name),
    ...article.regions.map((r) => r.name),
    ...article.topics.map((t) => t.name),
  ].join(", ");

  // 👇 JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle", // o "Article"
    headline: title,
    description,
    image: ogImages.map((i) => i.url),
    datePublished: article.publicationDate,
    dateModified: article.updatedAt,
    author: authorsMeta.map((a) => ({
      "@type": "Person",
      name: a.name,
      url: a.url,
    })),
    publisher: {
      "@type": "Organization",
      name: "ILA – Das Lateinamerika-Magazin",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/ila-logo.png`, // 👈 pon un logo real de ILA aquí
        width: 196,
        height: 196,
      },
    },
    inLanguage: params.locale,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  return {
    title,
    description,
    keywords,

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
        publishedTime: article.publicationDate,
        modifiedTime: article.updatedAt,
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

    // 👇 Aquí inyectamos JSON-LD
    other: [
      { name: "language", content: params.locale },
      {
        name: "structured-data",
        content: JSON.stringify(jsonLd),
      },
    ],
  };
}

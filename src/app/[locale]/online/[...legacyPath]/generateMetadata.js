// app/[locale]/online/[...legacyPath]/generateMetadata.js
import { getArticleByLegacyPath } from "@/lib/api/articles";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata({ params }) {
  const { locale, legacyPath } = await params;

  const slug = legacyPath.join("/");
  const fullPath = `/online/${slug}`;
  const canonicalUrl = `${SITE_URL}/${locale}${fullPath}`;

  const article = await getArticleByLegacyPath(fullPath);
  if (!article) {
    return {
      title: "Artículo no encontrado – ila",
      description: "El artículo solicitado no fue encontrado.",
      alternates: { canonical: canonicalUrl },
      robots: { index: false, follow: false },
    };
  }

  const isES = locale === "es";

  const title = `${
    isES && article.isTranslatedES ? article.titleES : article.title
  } – ila`;

  const fallbackDescription = isES
    ? "Artículo publicado en ILA – Revista sobre América Latina."
    : "Artikel erschienen in ILA – Das Lateinamerika-Magazin.";

  const description =
    (isES && article.isTranslatedES
      ? article.subtitleES || article.previewTextES
      : article.subtitle || article.previewText) || fallbackDescription;

  const imageUrl = article.images?.[0]?.url || article.edition?.coverImage;
  const ogImages = imageUrl
    ? [
        {
          url: imageUrl,
          alt: article.images?.[0]?.alt || title,
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

    other: {
      language: locale,
    },
  };
}

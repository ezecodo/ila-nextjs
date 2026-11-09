// app/[locale]/ausgaben/[...legacyPath]/generateMetadata.js
import { getArticleByLegacyPath } from "@/lib/api/articles";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// 👇 CAMBIA ESTO - Añade "await" delante de params
export async function generateMetadata({ params }) {
  // 👇 DESESTRUCTURA params DESPUÉS de await
  const { locale, legacyPath } = await params;

  const slug = legacyPath.join("/");
  const fullPath = `/ausgaben/${slug}`;
  // Canonical SIEMPRE con locale: la URL sin locale (/ausgaben/...) redirige
  // a /de/... y Google ignora un canonical que apunta a una redirección.
  const deUrl = `${SITE_URL}/de${fullPath}`;
  const esUrl = `${SITE_URL}/es${fullPath}`;
  let canonicalUrl = `${SITE_URL}/${locale}${fullPath}`;

  const article = await getArticleByLegacyPath(fullPath);
  if (!article) {
    return {
      title: "Artículo no encontrado – ila",
      description: "El artículo solicitado no fue encontrado.",
      alternates: { canonical: canonicalUrl },
      robots: { index: false, follow: false },
    };
  }

  // 👇 Ahora usa "locale" en lugar de "params.locale"
  const isES = locale === "es";
  // Mismo criterio que page.js: la versión ES solo es pública si la
  // traducción está APROBADA; si no, /es/... muestra el texto alemán →
  // es un duplicado de /de/... y el canonical tiene que apuntar ahí.
  const esApproved = article.translationStatus === "approved";
  const showES = isES && esApproved;
  canonicalUrl = showES ? esUrl : deUrl;
  const alternates = {
    canonical: canonicalUrl,
    languages: {
      de: deUrl,
      ...(esApproved ? { es: esUrl } : {}),
      "x-default": deUrl,
    },
  };

  const title = `${
    showES ? article.titleES : article.title
  } – ila`;

  const fallbackDescription = isES
    ? "Artículo publicado en ILA – Revista sobre América Latina."
    : "Artikel erschienen in ILA – Das Lateinamerika-Magazin.";

  const description =
    (showES
      ? article.subtitleES || article.previewTextES
      : article.subtitle || article.previewText) || fallbackDescription;

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
    url: `${SITE_URL}/${locale}/authors/${a.id}`,
  }));
  const ogAuthors = article.authors.map((a) => `${SITE_URL}/${locale}/authors/${a.id}`);

  const keywords = [
    showES ? article.titleES : article.title,
    ...article.authors.map((a) => a.name),
    ...article.regions.map((r) => r.name),
    ...article.topics.map((t) => t.name),
  ].join(", ");

  return {
    title,
    description,
    keywords,

    alternates,
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

// app/[locale]/editions/[id]/generateMetadata.js
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Quita el HTML del summary y lo recorta para la descripción del preview.
function toPlainExcerpt(html, max = 200) {
  if (!html) return "";
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  const editionId = parseInt(id, 10);
  const canonicalUrl = `${SITE_URL}/${locale}/editions/${id}`;

  const isES = locale === "es";

  if (!editionId || Number.isNaN(editionId)) {
    return {
      title: "ila",
      alternates: { canonical: canonicalUrl },
    };
  }

  const edition = await prisma.edition.findUnique({
    where: { id: editionId },
    select: {
      number: true,
      title: true,
      subtitle: true,
      summary: true,
      coverImage: true,
      titleES: true,
      subtitleES: true,
      summaryES: true,
      isTranslatedES: true,
    },
  });

  if (!edition) {
    return {
      title: "ila",
      description: isES
        ? "Dossier no encontrado."
        : "Ausgabe nicht gefunden.",
      alternates: { canonical: canonicalUrl },
      robots: { index: false, follow: false },
    };
  }

  const useES = isES && edition.isTranslatedES;
  const dossierTitle =
    (useES ? edition.titleES : edition.title) || edition.title || "";
  const dossierSubtitle =
    (useES ? edition.subtitleES : edition.subtitle) || edition.subtitle || "";
  const dossierSummary = useES ? edition.summaryES : edition.summary;

  const title = `ila ${edition.number}${
    dossierTitle ? ` — ${dossierTitle}` : ""
  }`;

  const fallbackDescription = isES
    ? "Dossier de ILA – Revista sobre América Latina."
    : "Ausgabe der ila – Das Lateinamerika-Magazin.";

  const description =
    dossierSubtitle ||
    toPlainExcerpt(dossierSummary) ||
    fallbackDescription;

  const coverIsAbsolute = /^https?:\/\//i.test(edition.coverImage || "");
  const imageUrl = edition.coverImage
    ? coverIsAbsolute
      ? edition.coverImage
      : `${SITE_URL}${
          edition.coverImage.startsWith("/") ? "" : "/"
        }${edition.coverImage}`
    : `${SITE_URL}/default-og.png`;

  const ogImages = [
    {
      url: imageUrl,
      alt: title,
    },
  ];

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },

    openGraph: {
      type: "article",
      title,
      description,
      url: canonicalUrl,
      siteName: "ILA",
      images: ogImages,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((i) => i.url),
    },

    other: {
      language: locale,
    },
  };
}

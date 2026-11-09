// Metadatos (título, canonical, hreflang) para las páginas de resultado por
// entidad: /entities/{topics,regions,categories}/[id] y /authors/[id].
// Esas páginas son client components (no pueden exportar metadata), así que
// cada segmento tiene un layout.js server que reexporta esto.
// Sin esto, las ~7.800 páginas salían con el mismo <title> genérico del sitio
// y sin canonical → Google las marcaba "Duplicada sin canónica".
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const KINDS = {
  topics: {
    path: (id) => `/entities/topics/${id}`,
    find: (id) =>
      prisma.topic.findUnique({ where: { id }, select: { name: true, nameES: true } }),
    label: { de: "Thema", es: "Tema" },
  },
  regions: {
    path: (id) => `/entities/regions/${id}`,
    find: (id) =>
      prisma.region.findUnique({ where: { id }, select: { name: true, nameES: true } }),
    label: { de: "Region", es: "Región" },
  },
  categories: {
    path: (id) => `/entities/categories/${id}`,
    find: (id) =>
      prisma.category.findUnique({ where: { id }, select: { name: true, nameES: true } }),
    label: { de: "Rubrik", es: "Sección" },
  },
  authors: {
    path: (id) => `/authors/${id}`,
    find: (id) =>
      prisma.author.findUnique({ where: { id }, select: { name: true } }),
    label: { de: "Autor:in", es: "Autor/a" },
  },
};

export function entityMetadata(kind) {
  const cfg = KINDS[kind];

  return async function generateMetadata({ params }) {
    const { locale, id } = await params;
    const isES = locale === "es";
    const path = cfg.path(id);
    const canonical = `${SITE_URL}/${locale}${path}`;
    const alternates = {
      canonical,
      languages: {
        de: `${SITE_URL}/de${path}`,
        es: `${SITE_URL}/es${path}`,
        "x-default": `${SITE_URL}/de${path}`,
      },
    };

    const numericId = parseInt(id, 10);
    let entity = null;
    if (numericId && !Number.isNaN(numericId)) {
      try {
        entity = await cfg.find(numericId);
      } catch (error) {
        // Si la BD falla, la página tiene que seguir funcionando igual:
        // metadatos genéricos de siempre, sin romper el render.
        console.error("❌ entityMetadata:", kind, id, error);
        return { alternates };
      }
    }

    if (!entity) {
      return { alternates, robots: { index: false, follow: true } };
    }

    const name = (isES && entity.nameES) || entity.name;
    const label = cfg.label[isES ? "es" : "de"];
    const title = `${name} – ${label} – ila`;
    const description = isES
      ? `Artículos de ila – Revista sobre América Latina: ${name}.`
      : `Artikel der ila – Das Lateinamerika-Magazin: ${name}.`;

    return {
      title,
      description,
      alternates,
      openGraph: { title, description, url: canonical, siteName: "ILA" },
    };
  };
}

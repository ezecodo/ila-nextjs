import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;
const baseUrl = "https://www.ila-web.de";
const locales = ["de", "es"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ========== PÁGINA RAÍZ (SIN LOCALE) ==========
  const rootPage = {
    url: `${baseUrl}/`, // https://www.ila-web.de/
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 1.0,
  };
  // ========== PÁGINAS ESTÁTICAS ==========
  const staticRoutes = [
    "", // home
    "/about/agb",
    "/about/contact",
    "/about/editorial",
    "/about/history",
    "/about/legal",
    "/about/network",
    "/about/privacy",
    "/about/speakers",
    "/aktuell/aktuelles",
    "/contents/current-issue",
    "/editions",
    "/events",
    "/order/abo",
    "/order/single-dossier-order",
    "/search",
    "/support/donations",
    "/support/participate",
    "/support/service/ads",
    "/support/service/referent-service",
    "/support/service/translation-service",
    "/support/testament",
  ];

  const staticPages = staticRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "" ? 0.9 : 0.5, // /de y /es prioridad 0.9 (no 1.0)
    }))
  );

  // ========== ARTÍCULOS (legacyPath) ==========
  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      legacyPath: { not: null },
    },
    select: {
      legacyPath: true,
      updatedAt: true,
      isTranslatedES: true,
    },
  });

  const articlePages = articles.flatMap(
    (article: {
      legacyPath: string | null;
      updatedAt: Date;
      isTranslatedES: boolean;
    }) => {
      const pages = [
        {
          url: `${baseUrl}/de${article.legacyPath}`,
          lastModified: article.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        },
      ];

      // Solo añadir versión ES si está traducido
      if (article.isTranslatedES) {
        pages.push({
          url: `${baseUrl}/es${article.legacyPath}`,
          lastModified: article.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        });
      }

      return pages;
    }
  );

  // ========== EDICIONES ==========
  const editions = await prisma.edition.findMany({
    select: { id: true, datePublished: true },
  });

  const editionPages = editions.flatMap(
    (edition: { id: number; datePublished: Date }) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/editions/${edition.id}`,
        lastModified: edition.datePublished,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }))
  );

  // ========== AUTORES ==========
  const authors = await prisma.author.findMany({
    select: { id: true, createdAt: true },
  });

  const authorPages = authors.flatMap(
    (author: { id: number; createdAt: Date }) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/authors/${author.id}`,
        lastModified: author.createdAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
  );

  // ========== EVENTOS ==========
  const events = await prisma.event.findMany({
    select: { id: true, date: true },
  });

  const eventPages = events.flatMap((event: { id: string; date: Date }) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/events/${event.id}`,
      lastModified: event.date,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))
  );

  // ========== ENTITIES (categories, regions, topics) ==========
  const categories = await prisma.category.findMany({
    select: { id: true },
  });

  const categoryPages = categories.flatMap((cat: { id: number }) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/entities/categories/${cat.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }))
  );

  const regions = await prisma.region.findMany({
    select: { id: true },
  });

  const regionPages = regions.flatMap((region: { id: number }) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/entities/regions/${region.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }))
  );

  const topics = await prisma.topic.findMany({
    select: { id: true },
  });

  const topicPages = topics.flatMap((topic: { id: number }) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/entities/topics/${topic.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.4,
    }))
  );

  return [
    rootPage,
    ...staticPages,
    ...articlePages,
    ...editionPages,
    ...authorPages,
    ...eventPages,
    ...categoryPages,
    ...regionPages,
    ...topicPages,
  ];
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Artículos que cumplen a la vez los filtros de tema, tipo y autor (AND),
// acotados a una región. Alimenta el panel de país de GLOBila en modo combinado.
// Params: ?topicId= &typeId= &authorId= &regionId= &page=
// → { articles, totalArticles, totalPages, currentPage }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = parseInt(searchParams.get("topicId") || "", 10);
    const typeId = parseInt(searchParams.get("typeId") || "", 10);
    const authorId = parseInt(searchParams.get("authorId") || "", 10);
    const regionId = parseInt(searchParams.get("regionId") || "", 10);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const where = {};
    if (!isNaN(topicId)) where.topics = { some: { id: topicId } };
    if (!isNaN(typeId)) where.beitragstypId = typeId;
    if (!isNaN(authorId)) where.authors = { some: { id: authorId } };
    if (!isNaN(regionId)) where.regions = { some: { id: regionId } };

    if (Object.keys(where).length === 0) {
      return NextResponse.json({
        articles: [],
        totalArticles: 0,
        currentPage: page,
        totalPages: 0,
      });
    }

    const [articles, totalArticles] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publicationDate: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          legacyPath: true,
          title: true,
          titleES: true,
          isTranslatedES: true,
          subtitle: true,
          publicationDate: true,
          beitragsId: true,
          beitragstyp: { select: { id: true, name: true, nameES: true } },
          edition: { select: { id: true, number: true, title: true } },
          topics: { select: { id: true, name: true } },
          regions: { select: { id: true, name: true } },
          categories: { select: { id: true, name: true } },
          authors: { select: { id: true, name: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const imageFilters = [];
        if (article.beitragsId)
          imageFilters.push({ contentId: article.beitragsId });
        if (article.id) imageFilters.push({ contentId: article.id });

        const images = imageFilters.length
          ? await prisma.image.findMany({
              where: { contentType: "ARTICLE", OR: imageFilters },
              select: { url: true },
              take: 1,
            })
          : [];

        return { ...article, images };
      })
    );

    return NextResponse.json({
      articles: articlesWithImages,
      totalArticles,
      currentPage: page,
      totalPages: Math.ceil(totalArticles / pageSize),
    });
  } catch (error) {
    console.error("❌ Error en la API de explore combinado:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

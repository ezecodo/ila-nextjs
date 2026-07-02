import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Artículos de un autor, opcionalmente filtrados por región.
// GLOBila lo usa para poblar el panel de país cuando explorás por autor.
// → { articles, totalArticles, totalPages, currentPage }
export async function GET(request, context) {
  try {
    const params = await context?.params;
    const authorId = parseInt(params?.id, 10);
    if (isNaN(authorId)) {
      return NextResponse.json({ error: "ID de autor inválido" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const regionIdRaw = searchParams.get("regionId");
    const regionId = regionIdRaw ? parseInt(regionIdRaw, 10) : null;
    const regionWhere =
      regionId && !isNaN(regionId)
        ? { regions: { some: { id: regionId } } }
        : {};

    const where = { authors: { some: { id: authorId } }, ...regionWhere };

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
    console.error("❌ Error en la API de autor por artículo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const locale = searchParams.get("locale") || "de";

    if (!query || query.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Se requiere un término de búsqueda" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const searchQuery = query.toLowerCase();

    let whereConditions;

    if (locale === "es") {
      whereConditions = {
        isPublished: true,
        isTranslatedES: true,
        needsReviewES: false,
        OR: [
          { titleES: { contains: searchQuery } },
          { contentES: { contains: searchQuery } },
        ],
      };
    } else {
      whereConditions = {
        isPublished: true,
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
        ],
      };
    }

    const articles = await prisma.article.findMany({
      where: whereConditions,
      orderBy: { publicationDate: "desc" },
      skip: offset,
      take: limit,
      include: {
        regions: true,
        topics: true,
        authors: { select: { id: true, name: true } },
        categories: true,
        beitragstyp: { select: { id: true, name: true } },
        edition: { select: { title: true, number: true } },
      },
    });

    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId: article.beitragsId,
          },
        });
        return { ...article, images };
      })
    );

    const totalArticles = await prisma.article.count({
      where: whereConditions,
    });

    return new Response(
      JSON.stringify({
        articles: articlesWithImages,
        totalArticles,
        currentPage: page,
        totalPages: Math.ceil(totalArticles / limit),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error en la búsqueda:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

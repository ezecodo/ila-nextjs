import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const showFavorites = searchParams.get("favorites") === "true";
    const editionId = searchParams.get("editionId");
    const locale = searchParams.get("locale");
    const beitragstypId = searchParams.get("beitragstypId");
    const reviewerMode = searchParams.get("reviewer") === "true";
    const unassignedMode = searchParams.get("unassigned") === "true";
    const translatorId = searchParams.get("translatorId");

    let whereCondition = { isPublished: true };

    if (translatorId) {
      whereCondition.translatorId = translatorId;
    }

    if (reviewerMode) {
      const session = await auth();
      if (!session || !session.user) {
        return new Response(JSON.stringify({ message: "No autorizado" }), {
          status: 401,
        });
      }
      whereCondition = {
        ...whereCondition,
        reviewerId: session.user.id,
        translatorId: { not: null },
        translationStatus: { in: ["in_progress", "submitted"] },
      };
    }

    if (unassignedMode) {
      whereCondition = {
        ...whereCondition,
        isTranslatedES: false,
      };
    }

    if (editionId) {
      whereCondition.editionId = parseInt(editionId, 10);
    }

    if (showFavorites) {
      const session = await auth();
      if (!session || !session.user) {
        return new Response(JSON.stringify({ message: "No autorizado" }), {
          status: 401,
        });
      }
      whereCondition = {
        favorites: { some: { userId: session.user.id } },
      };
    }

    if (locale === "es") {
      whereCondition.isTranslatedES = true;
      whereCondition.needsReviewES = false;
    }

    if (beitragstypId) {
      whereCondition.beitragstypId = parseInt(beitragstypId, 10);
    }

    const articles = await prisma.article.findMany({
      where: whereCondition,
      orderBy: { publicationDate: "desc" },
      skip: offset,
      take: limit,
      include: {
        regions: true,
        topics: true,
        authors: { select: { id: true, name: true } },
        categories: true,
        beitragstyp: { select: { id: true, name: true, nameES: true } },
        edition: { select: { id: true, title: true, number: true } },
        translator: { select: { id: true, name: true, email: true } },
      },
    });

    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId: { in: [article.beitragsId, article.id].filter(Boolean) },
          },
          select: { id: true, url: true, width: true, height: true },
        });

        return { ...article, images };
      })
    );

    const totalArticles = await prisma.article.count({ where: whereCondition });

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
    console.error("Error en API de artículos:", error);
    return new Response(
      JSON.stringify({ message: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

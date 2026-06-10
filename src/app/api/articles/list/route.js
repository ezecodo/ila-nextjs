import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    let limit = parseInt(searchParams.get("limit") || "200");
    const offset = (page - 1) * limit;
    // 👇 Si está en español, levantamos más artículos para no quedarnos cortos
    const locale = searchParams.get("locale");
    if (locale === "es") {
      limit = 100; // pedimos hasta 100
    }

    const showFavorites = searchParams.get("favorites") === "true";
    const editionId = searchParams.get("editionId");
    const nurOnline = searchParams.get("nurOnline") === "true";
    const unpublished = searchParams.get("unpublished") === "true";

    const beitragstypId = searchParams.get("beitragstypId");
    const reviewerMode = searchParams.get("reviewer") === "true";
    const unassignedMode = searchParams.get("unassigned") === "true";
    const translatorId = searchParams.get("translatorId");
    const assigned = searchParams.get("assigned") === "true";
    const translated = searchParams.get("translated") === "true";
    const authorId = searchParams.get("authorId");

    let whereCondition = {};

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
        translationStatus: { in: ["in_progress", "submitted", "approved"] },
      };
    }

    if (unassignedMode) {
      whereCondition = {
        ...whereCondition,
        isTranslatedES: false,
      };
    }

    if (nurOnline) {
      whereCondition = {
        ...whereCondition,
        isInPrintEdition: false,
        editionId: null, // solo artículos sin dossier
      };
    } else if (unpublished) {
      whereCondition = {
        ...whereCondition,
        isPublished: false,
      };
    } else if (editionId) {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // final del día local

      whereCondition = {
        ...whereCondition,
        editionId: parseInt(editionId, 10),
        isPublished: true,
        publicationDate: { lte: today },
      };
    }
    if (showFavorites) {
      const session = await auth();
      if (!session || !session.user) {
        return new Response(JSON.stringify({ message: "No autorizado" }), {
          status: 401,
        });
      }
      whereCondition = {
        ...whereCondition, // 👈 mantiene lo que ya había (ej. translatorId, editionId…)
        favorites: { some: { userId: session.user.id } },
      };
    }
    if (locale === "es") {
      whereCondition.isTranslatedES = true;

      // Solo aplicamos needsReviewES = false si NO es el filtro "traducidos"
      if (!translated) {
        whereCondition.needsReviewES = false;
      }
    }

    if (beitragstypId) {
      whereCondition.beitragstypId = parseInt(beitragstypId, 10);
    }
    const categoryId = searchParams.get("categoryId");
    if (categoryId) {
      whereCondition.categories = {
        some: { id: parseInt(categoryId, 10) },
      };
    }

    // 🆕 Filtro por autor
    if (authorId) {
      whereCondition.authors = {
        some: { id: parseInt(authorId, 10) },
      };
    }

    if (assigned) {
      whereCondition = {
        ...whereCondition,
        translatorId: { not: null }, // 👈 artículos ya asignados
        // 👇 solo los pendientes: traducción aún no enviada ni revisada
        translationStatus: { notIn: ["submitted", "approved"] },
      };
    }

    if (translated) {
      whereCondition = {
        ...whereCondition,
        isTranslatedES: true, // traducidos
        needsReviewES: false, // y ya revisados
      };
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

        return { ...article, images, hasImage: images.length > 0 };
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

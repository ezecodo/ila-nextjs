import { auth } from "@/app/auth"; // 🔥 Asegura autenticación

import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const showFavorites = searchParams.get("favorites") === "true";
    const editionId = searchParams.get("editionId");

    let whereCondition = { isPublished: true };

    // 🔥 Filtrar por edición si se proporciona
    if (editionId) {
      whereCondition.editionId = parseInt(editionId, 10);
    }

    if (showFavorites) {
      const session = await auth(); // ✅ Obtiene la sesión del usuario
      if (!session || !session.user) {
        return new Response(JSON.stringify({ message: "No autorizado" }), {
          status: 401,
        });
      }
      whereCondition = {
        favorites: {
          some: { userId: session.user.id }, // 🔥 Filtra los favoritos del usuario
        },
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
        authors: {
          select: { id: true, name: true },
        },
        categories: true,
        beitragstyp: {
          select: { id: true, name: true },
        },
        edition: {
          select: { id: true, title: true, number: true },
        },
      },
    });

    // Agregar imágenes relacionadas
    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        console.log(`🔍 Buscando imágenes para artículo ID ${article.id}`);

        // Filtrar contentId null para evitar el error de Prisma
        const imageFilters = [];
        if (article.beitragsId)
          imageFilters.push({ contentId: article.beitragsId });
        if (article.id) imageFilters.push({ contentId: article.id });

        const images = imageFilters.length
          ? await prisma.image.findMany({
              where: {
                contentType: "ARTICLE",
                OR: imageFilters, // Solo enviamos IDs válidos
              },
            })
          : []; // Si no hay IDs válidos, devolvemos un array vacío

        console.log(
          `📸 ${images.length} imágenes encontradas para artículo ${article.id}`
        );

        return {
          ...article,
          images, // ✅ Agregar imágenes al artículo
        };
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

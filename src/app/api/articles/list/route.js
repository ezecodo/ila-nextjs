import { PrismaClient } from "@prisma/client";
import { auth } from "@/app/auth"; // Asegurar importación correcta

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const onlyFavorites = searchParams.get("favorites") === "true"; // 🔥 Saber si se quieren solo favoritos

    // Obtener la sesión del usuario (si está logueado)
    const session = await auth();
    const userId = session?.user?.id || null;

    // 🔍 Si se piden favoritos, pero el usuario no está logueado, devolvemos error
    if (onlyFavorites && !userId) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
      });
    }

    // 🔥 Construimos la consulta de artículos
    const whereCondition = {
      isPublished: true,
      ...(onlyFavorites && userId
        ? { favorites: { some: { userId } } } // Filtra solo los favoritos del usuario
        : {}),
    };

    // Obtener los artículos paginados, ordenados por fecha de publicación
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
        beitragstyp: { select: { id: true, name: true } },
        edition: { select: { title: true, number: true } },
      },
    });

    // 🔥 Agregar imágenes relacionadas
    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const images = await prisma.image.findMany({
          where: { contentType: "ARTICLE", contentId: article.beitragsId },
        });

        return { ...article, images }; // Agregar imágenes al artículo
      })
    );

    // Contar el total de artículos
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
    console.error("Error al obtener artículos:", error);
    return new Response(
      JSON.stringify({ message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Obtener los artículos paginados, ordenados por fecha de publicación (desc)
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      orderBy: {
        publicationDate: "desc", // 🔥 Ordenar por fecha de publicación (más recientes primero)
      },
      skip: offset,
      take: limit,
      include: {
        regions: true,
        topics: true,
        authors: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        beitragstyp: {
          select: {
            id: true,
            name: true,
          },
        },
        edition: {
          select: {
            title: true,
            number: true,
          },
        },
      },
    });

    // Agregar imágenes relacionadas
    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId: article.beitragsId,
          },
        });

        return {
          ...article,
          images, // Agregar las imágenes al artículo
        };
      })
    );

    // Contar el total de artículos
    const totalArticles = await prisma.article.count({
      where: { isPublished: true },
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
    console.error("Error al obtener artículos:", error);
    return new Response(
      JSON.stringify({ message: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

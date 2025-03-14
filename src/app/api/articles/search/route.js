import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    // 📌 Obtener parámetros de búsqueda y paginación
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    if (!query || query.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Se requiere un término de búsqueda" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔥 Normalizamos el query para hacerlo insensible a mayúsculas
    const searchQuery = query.toLowerCase();

    // 🔥 Buscar artículos en la base de datos
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
        ],
      },
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
          select: { title: true, number: true },
        },
      },
    });

    // 🔥 Agregar imágenes relacionadas a cada artículo
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
          images, // ✅ Agregar imágenes al artículo
        };
      })
    );

    // 🔥 Obtener total de artículos para la paginación
    const totalArticles = await prisma.article.count({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: searchQuery } },
          { content: { contains: searchQuery } },
        ],
      },
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

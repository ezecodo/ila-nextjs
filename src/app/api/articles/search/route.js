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

    const searchQuery = query.trim();

    let whereConditions;

    if (locale === "es") {
      whereConditions = {
        isPublished: true,
        isTranslatedES: true,
        needsReviewES: false,
        OR: [
          // 🎯 Título en español
          { titleES: { contains: searchQuery } },
          // 🎯 Subtítulo en español
          { subtitleES: { contains: searchQuery } },
          // 🎯 Contenido en español
          { contentES: { contains: searchQuery } },
          // 👤 Autores
          {
            authors: {
              some: { name: { contains: searchQuery } },
            },
          },
          // 👤 Entrevistados
          {
            interviewees: {
              some: { name: { contains: searchQuery } },
            },
          },
        ],
      };
    } else {
      whereConditions = {
        isPublished: true,
        OR: [
          // 🎯 Título en alemán
          { title: { contains: searchQuery } },
          // 🎯 Subtítulo en alemán
          { subtitle: { contains: searchQuery } },
          // 🎯 Contenido en alemán
          { content: { contains: searchQuery } },
          // 👤 Autores
          {
            authors: {
              some: { name: { contains: searchQuery } },
            },
          },
          // 👤 Entrevistados
          {
            interviewees: {
              some: { name: { contains: searchQuery } },
            },
          },
        ],
      };
    }

    console.log("🔎 Búsqueda:", searchQuery, "Locale:", locale);

    // 📊 Buscar artículos
    const articles = await prisma.article.findMany({
      where: whereConditions,
      orderBy: { publicationDate: "desc" },
      skip: offset,
      take: limit,
      include: {
        regions: true,
        topics: true,
        authors: { select: { id: true, name: true } },
        interviewees: { select: { id: true, name: true } },
        categories: true,
        beitragstyp: { select: { id: true, name: true } },
        edition: { select: { title: true, number: true } },
      },
    });

    // 📸 Agregar imágenes
    const articlesWithImages = await Promise.all(
      articles.map(async (article) => {
        const images = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId: article.beitragsId || article.id,
          },
        });
        return { ...article, images };
      })
    );

    // 🔢 Contar total
    const totalArticles = await prisma.article.count({
      where: whereConditions,
    });

    console.log("✅ Resultados encontrados:", totalArticles);

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

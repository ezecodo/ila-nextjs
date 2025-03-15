import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, context) {
  try {
    const params = await context?.params;
    if (!params || !params.id) {
      return new Response(
        JSON.stringify({ error: "Se requiere el ID del topic" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const topicId = parseInt(params.id, 10);
    if (isNaN(topicId)) {
      return new Response(JSON.stringify({ error: "ID de topic inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    console.log(`✅ Buscando topic con ID: ${topicId} - Página: ${page}`);

    // 🔥 Obtener el topic con artículos y ediciones
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        articles: {
          orderBy: { publicationDate: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            title: true,
            subtitle: true,
            publicationDate: true,
            beitragsId: true,
            edition: { select: { id: true, number: true, title: true } },
            topics: { select: { id: true, name: true } },
            regions: { select: { id: true, name: true } },
            categories: { select: { id: true, name: true } },
            authors: { select: { id: true, name: true } },
          },
        },
        editions: {
          orderBy: { number: "desc" },
          select: {
            id: true,
            number: true,
            title: true,
            subtitle: true,
            datePublished: true,
            coverImage: true,
            topics: { select: { id: true, name: true } },
            regions: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔥 Contar total de artículos en el topic
    const totalArticles = await prisma.article.count({
      where: { topics: { some: { id: topicId } } },
    });

    // 🔥 Contar total de ediciones en el topic
    const totalEditions = await prisma.edition.count({
      where: { topics: { some: { id: topicId } } },
    });

    console.log(
      `✅ Topic encontrado: ${topic.name} - Artículos: ${topic.articles.length} - Ediciones: ${topic.editions.length}`
    );

    // 🔥 Obtener imágenes de cada artículo basado en `beitragsId`
    const articlesWithImages = await Promise.all(
      topic.articles.map(async (article) => {
        const imageFilters = [];
        if (article.beitragsId)
          imageFilters.push({ contentId: article.beitragsId });
        if (article.id) imageFilters.push({ contentId: article.id });

        const images = imageFilters.length
          ? await prisma.image.findMany({
              where: {
                contentType: "ARTICLE",
                OR: imageFilters,
              },
              select: { url: true },
              take: 1,
            })
          : [];

        return { ...article, images };
      })
    );

    // 🔥 Construcción de la respuesta con paginación
    const responseData = {
      topic: {
        id: topic.id,
        name: topic.name || "Topic desconocido",
      },
      articles: articlesWithImages,
      editions: topic.editions, // ✅ Ahora también enviamos las ediciones
      pagination: {
        totalArticles,
        totalEditions,
        page,
        pageSize,
        hasMore: skip + pageSize < totalArticles,
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error en la API de topics:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

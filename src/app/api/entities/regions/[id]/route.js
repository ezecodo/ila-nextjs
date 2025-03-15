import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, context) {
  try {
    // ✅ Obtener `params` de `context`
    const params = await context?.params;
    if (!params || !params.id) {
      return new Response(
        JSON.stringify({ error: "Se requiere el ID de la región" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) {
      return new Response(JSON.stringify({ error: "ID de región inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Obtener parámetros de la URL (paginación)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 20; // 🔥 Número de artículos por página
    const skip = (page - 1) * pageSize;

    console.log(`✅ Buscando región con ID: ${regionId} - Página: ${page}`);

    // 🔥 Obtener región con sus artículos paginados
    const region = await prisma.region.findUnique({
      where: { id: regionId },
      include: {
        articles: {
          orderBy: { publicationDate: "desc" },
          skip, // 🔥 Salta los primeros `skip` resultados
          take: pageSize, // 🔥 Toma `pageSize` artículos
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
      },
    });

    if (!region) {
      return new Response(JSON.stringify({ error: "Región no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🔥 Contar total de artículos en la región para paginación
    const totalArticles = await prisma.article.count({
      where: { regions: { some: { id: regionId } } },
    });

    console.log(
      `✅ Región encontrada: ${region.name} - Artículos: ${region.articles.length}`
    );

    // 🔥 Obtener imágenes de cada artículo basado en `beitragsId`
    const articlesWithImages = await Promise.all(
      region.articles.map(async (article) => {
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
      region: {
        id: region.id,
        name: region.name || "Región desconocida",
      },
      articles: articlesWithImages,
      pagination: {
        total: totalArticles,
        page,
        pageSize,
        hasMore: skip + pageSize < totalArticles, // 🔥 Saber si hay más páginas
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error en la API de regiones:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

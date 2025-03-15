import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, context) {
  try {
    // ✅ Obtener `params` de `context`
    const params = await context?.params;
    if (!params || !params.id) {
      return new Response(
        JSON.stringify({ error: "Se requiere el ID de la categoría" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const categoryId = parseInt(params.id, 10);
    if (isNaN(categoryId)) {
      return new Response(
        JSON.stringify({ error: "ID de categoría inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Obtener parámetros de la URL (paginación)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = 20; // 🔥 Número de artículos por página
    const skip = (page - 1) * pageSize;

    console.log(
      `✅ Buscando categoría con ID: ${categoryId} - Página: ${page}`
    );

    // 🔥 Obtener categoría con sus artículos paginados
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
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

    if (!category) {
      return new Response(
        JSON.stringify({ error: "Categoría no encontrada" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔥 Contar total de artículos en la categoría para paginación
    const totalArticles = await prisma.article.count({
      where: { categories: { some: { id: categoryId } } },
    });

    console.log(
      `✅ Categoría encontrada: ${category.name} - Artículos: ${category.articles.length}`
    );

    // 🔥 Obtener imágenes de cada artículo basado en `beitragsId`
    const articlesWithImages = await Promise.all(
      category.articles.map(async (article) => {
        // Definir los filtros de imagen
        const imageFilters = [];
        if (article.beitragsId)
          imageFilters.push({ contentId: article.beitragsId });
        if (article.id) imageFilters.push({ contentId: article.id });

        // Obtener las imágenes si hay filtros válidos
        const images = imageFilters.length
          ? await prisma.image.findMany({
              where: {
                contentType: "ARTICLE",
                OR: imageFilters, // 🔥 Filtra por `beitragsId` o `id`
              },
              select: { url: true },
              take: 1,
            })
          : []; // 🔥 Si no hay IDs válidos, devuelve un array vacío

        return { ...article, images };
      })
    );

    // 🔥 Construcción de la respuesta con paginación
    const responseData = {
      category: {
        id: category.id,
        name: category.name || "Categoría desconocida",
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
    console.error("❌ Error en la API de categorías:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

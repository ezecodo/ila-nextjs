import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

export async function GET(request, context) {
  try {
    // ✅ Extraer `params` de `context` y asegurar que existen
    const params = await context?.params;
    if (!params || !params.id) {
      console.error("❌ Error: ID del autor no recibido");
      return new Response(
        JSON.stringify({ error: "Se requiere el ID del autor" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const authorId = parseInt(params.id, 10);
    if (isNaN(authorId)) {
      console.error("❌ Error: ID inválido", params.id);
      return new Response(JSON.stringify({ error: "ID de autor inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Buscando autor con ID: ${authorId}`);

    // 🔥 Obtener autor con artículos SIN imágenes todavía
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: {
        articles: {
          orderBy: { publicationDate: "desc" },
          select: {
            id: true,
            title: true,
            subtitle: true,
            publicationDate: true,
            beitragsId: true, // Clave para buscar imágenes
            legacyPath: true, // 👈 NECESARIO para ArticleLink
            edition: { select: { id: true, number: true, title: true } },
            topics: { select: { id: true, name: true } },
            regions: { select: { id: true, name: true } },
            categories: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!author) {
      console.warn(`⚠️ Autor con ID ${authorId} no encontrado`);
      return new Response(JSON.stringify({ error: "Autor no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Autor encontrado: ${author.name}`);

    // 🔥 Obtener imágenes de cada artículo basado en `beitragsId`

    const articlesWithImages = await Promise.all(
      author.articles.map(async (article) => {
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

    // 🔥 Construcción de la respuesta con imágenes
    const responseData = {
      author: {
        id: author.id,
        name: author.name || "Autor desconocido",
      },
      articles: articlesWithImages,
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error en la API de autores:", error.message);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

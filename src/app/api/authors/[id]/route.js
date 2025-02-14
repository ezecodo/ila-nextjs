import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, context) {
  try {
    // ✅ Acceder a los parámetros de forma correcta (sin `await`)
    const { params } = context ?? {}; // ✅ Aseguramos que `context` existe
    if (!params || !params.id) {
      console.error("❌ Error: ID del autor no recibido");
      return new Response(
        JSON.stringify({ error: "Se requiere el ID del autor" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convertimos ID a número
    const authorId = parseInt(params.id, 10);
    if (isNaN(authorId)) {
      console.error("❌ Error: ID inválido", params.id);
      return new Response(JSON.stringify({ error: "ID de autor inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`✅ Buscando autor con ID: ${authorId}`);

    // Buscar al autor y sus artículos
    const author = await prisma.author.findUnique({
      where: { id: authorId },
      include: {
        articles: {
          orderBy: { publicationDate: "desc" },
          select: {
            // ✅ Usamos `select`, no `include`
            id: true,
            title: true,
            subtitle: true,
            publicationDate: true,
            articleImage: true, // ✅ Campo normal, no relación
            edition: { select: { id: true, number: true, title: true } },
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

    // Estructurar la respuesta segura
    const responseData = {
      author: {
        id: author.id,
        name: author.name || "Autor desconocido",
      },
      articles: author.articles.map((article) => ({
        id: article.id,
        title: article.title || "Artículo sin título",
        subtitle: article.subtitle || null,
        publicationDate: article.publicationDate || null,
        coverImage: article.articleImage?.url || null,
        edition: article.edition
          ? {
              id: article.edition.id,
              number: article.edition.number,
              title: article.edition.title || "Edición sin título",
            }
          : null,
      })),
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

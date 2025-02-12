import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, context) {
  const params = await context.params; // ✅ Usa await aquí
  const id = params?.id; // ✅ Acceder de forma segura al ID

  if (!id) {
    return new Response(JSON.stringify({ error: "ID no proporcionado" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (isNaN(parseInt(id))) {
      return new Response(JSON.stringify({ error: "ID no válido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener el artículo con todos los campos necesarios
    const article = await prisma.article.findUnique({
      where: { id: parseInt(id) },
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            id: true, // ✅ Aseguramos que el ID de edición está incluido
            number: true,
            title: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        regions: true,
        topics: true,
      },
    });

    if (!article) {
      return new Response(JSON.stringify({ error: "Artículo no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener imágenes relacionadas del artículo
    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: article.beitragsId,
      },
    });

    // Incluir imágenes en la respuesta
    return new Response(
      JSON.stringify({
        ...article,
        images,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en GET /api/articles/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

import { prisma } from "@/lib/prisma";

export async function GET(req, context) {
  const params = await context.params;
  const { id } = params;

  const editionNumber = parseInt(id);

  if (!editionNumber || isNaN(editionNumber)) {
    return new Response(
      JSON.stringify({ error: "Número de edición inválido" }),
      { status: 400 },
    );
  }

  try {
    const edition = await prisma.edition.findUnique({
      where: { number: editionNumber },
    });

    if (!edition) {
      return new Response(JSON.stringify({ error: "Edición no encontrada" }), {
        status: 404,
      });
    }

    // 🔥 CAMBIO: Usar final del día en vez de hora actual
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const articles = await prisma.article.findMany({
      where: {
        editionId: edition.id,
        isPublished: true,
        OR: [
          { publicationDate: null },
          { publicationDate: { lte: today } }, // ← Cambiado de 'now' a 'today'
        ],
      },
      select: {
        id: true,
        title: true,
        subtitle: true,
        legacyPath: true,
        isPublished: true,
        publicationDate: true,
      },
      orderBy: {
        publicationDate: "asc",
      },
    });

    return new Response(JSON.stringify(articles), {
      status: 200,
    });
  } catch (error) {
    console.error("Error en /api/articles/edition/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500 },
    );
  }
}

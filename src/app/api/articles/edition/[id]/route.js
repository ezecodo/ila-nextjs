import { prisma } from "@/lib/prisma";

export async function GET(req, context) {
  const { id } = context.params;

  const editionNumber = parseInt(id);

  if (!editionNumber || isNaN(editionNumber)) {
    return new Response(
      JSON.stringify({ error: "Número de edición inválido" }),
      {
        status: 400,
      }
    );
  }

  try {
    // Buscar la edición que tenga ese número
    const edition = await prisma.edition.findUnique({
      where: { number: editionNumber },
    });

    if (!edition) {
      return new Response(JSON.stringify({ error: "Edición no encontrada" }), {
        status: 404,
      });
    }

    // Buscar artículos con editionId correspondiente
    const articles = await prisma.article.findMany({
      where: { editionId: edition.id },
      select: {
        id: true,
        title: true,
      },
    });

    return new Response(JSON.stringify(articles), {
      status: 200,
    });
  } catch (error) {
    console.error("Error en /api/articles/edition/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500 }
    );
  }
}

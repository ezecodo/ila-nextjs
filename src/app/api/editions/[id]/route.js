import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
  try {
    // Validar el parámetro ID
    const editionId = parseInt(params.id, 10);
    if (isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    // Buscar la edición en la base de datos
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      include: {
        regions: true, // Incluye las regiones asociadas
        topics: true, // Incluye los temas asociados
      },
    });

    // Si no se encuentra la edición
    if (!edition) {
      return new Response(JSON.stringify({ error: "Edición no encontrada" }), {
        status: 404,
      });
    }

    // Respuesta exitosa
    return new Response(JSON.stringify(edition), { status: 200 });
  } catch (error) {
    console.error("Error en el backend:", error);

    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

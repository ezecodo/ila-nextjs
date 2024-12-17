import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, context) {
  try {
    // Extraer params de forma segura
    const { params } = context;

    // Validar la existencia del parámetro id
    const editionId = params?.id ? parseInt(params.id, 10) : null;

    if (!editionId || isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido o faltante" }), {
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
    return new Response(JSON.stringify(edition), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en la ruta dinámica:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

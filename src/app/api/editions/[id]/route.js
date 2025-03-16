import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

export async function GET(req, context) {
  try {
    // ✅ Usa `await` para obtener `params` correctamente
    const params = await context.params;
    const editionId = params?.id ? parseInt(params.id, 10) : null;

    if (!editionId || isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido o faltante" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Buscar la edición en la base de datos
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      include: {
        regions: true, // Incluye las regiones asociadas
        topics: true, // Incluye los temas asociados
      },
    });

    if (!edition) {
      return new Response(JSON.stringify({ error: "Edición no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(edition), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en GET /api/editions/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

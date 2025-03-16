import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

export async function GET(req, { params }) {
  const { entity, id } = params;

  if (!entity || !id) {
    return new Response(
      JSON.stringify({ error: "Entidad o ID no proporcionado" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      return new Response(JSON.stringify({ error: "ID no válido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(req.url);
    const context = searchParams.get("context"); // 🔥 Identifica si la consulta es para ediciones o artículos

    let count = 0;

    if (context === "editions") {
      // 🔥 Contar EDICIONES relacionadas con la entidad
      switch (entity) {
        case "regions":
          count = await prisma.edition.count({
            where: {
              regions: { some: { id: parsedId } },
            },
          });
          break;

        case "topics":
          count = await prisma.edition.count({
            where: {
              topics: { some: { id: parsedId } },
            },
          });
          break;

        case "categories":
          count = await prisma.edition.count({
            where: {
              categories: { some: { id: parsedId } },
            },
          });
          break;

        default:
          return new Response(
            JSON.stringify({ error: "Entidad no reconocida para ediciones" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
      }
    } else {
      // 🔥 Contar ARTÍCULOS relacionados con la entidad
      switch (entity) {
        case "authors":
          count = await prisma.article.count({
            where: {
              authors: { some: { id: parsedId } },
            },
          });
          break;

        case "editions":
          count = await prisma.article.count({
            where: {
              editionId: parsedId,
            },
          });
          break;

        case "regions":
          count = await prisma.article.count({
            where: {
              regions: { some: { id: parsedId } },
            },
          });
          break;

        case "topics":
          count = await prisma.article.count({
            where: {
              topics: { some: { id: parsedId } },
            },
          });
          break;

        case "categories":
          count = await prisma.article.count({
            where: {
              categories: { some: { id: parsedId } },
            },
          });
          break;

        default:
          return new Response(
            JSON.stringify({ error: "Entidad no reconocida para artículos" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
      }
    }

    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`❌ Error al obtener conteo para ${entity}:`, error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

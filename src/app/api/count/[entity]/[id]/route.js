import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    let count = 0;

    switch (entity) {
      case "authors":
        // 🔥 Asegurarnos de contar los artículos correctamente
        count = await prisma.article.count({
          where: {
            authors: {
              some: {
                id: parsedId, // 📌 Buscar por relación
              },
            },
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
            regions: {
              some: { id: parsedId },
            },
          },
        });
        break;

      case "topics":
        count = await prisma.article.count({
          where: {
            topics: {
              some: { id: parsedId },
            },
          },
        });
        break;

      case "categories":
        count = await prisma.article.count({
          where: {
            categories: {
              some: { id: parsedId },
            },
          },
        });
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Entidad no reconocida" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
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

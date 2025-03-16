import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = parseInt(searchParams.get("id"));

    if (!type || isNaN(id)) {
      return new Response(JSON.stringify({ error: "Parámetros inválidos" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let count = 0;

    if (type === "author") {
      count = await prisma.article.count({
        where: { authors: { some: { id } } },
      });
    } else if (type === "region") {
      count = await prisma.article.count({
        where: { regions: { some: { id } } },
      });
    } else if (type === "category") {
      count = await prisma.article.count({
        where: { categories: { some: { id } } },
      });
    } else if (type === "topic") {
      count = await prisma.article.count({
        where: { topics: { some: { id } } },
      });
    } else {
      return new Response(JSON.stringify({ error: "Tipo no válido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ count }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en API /api/count:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

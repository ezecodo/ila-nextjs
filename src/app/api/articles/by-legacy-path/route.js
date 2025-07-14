import { prisma } from "@/lib/prisma";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return new Response(JSON.stringify({ error: "Falta parámetro path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const article = await prisma.article.findFirst({
      where: {
        legacyPath: path,
      },
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            id: true,
            number: true,
            title: true,
            coverImage: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
            _count: { select: { articles: true } },
          },
        },
        categories: true,
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

    const contentIdToUse = article.beitragsId || article.id;

    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: contentIdToUse,
      },
    });

    return new Response(JSON.stringify({ ...article, images }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en by-legacy-path:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

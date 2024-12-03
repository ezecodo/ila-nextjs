import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        isPublished: true, // Filtra solo los artículos publicados
      },
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
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
      },
      orderBy: { publicationDate: "desc" }, // Ordenar por fecha de publicación
    });

    return new Response(JSON.stringify(articles), { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/articles/published:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

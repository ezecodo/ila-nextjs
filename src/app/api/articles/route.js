import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { title, content, beitragstypId, beitragssubtypId, editionId } =
      await req.json();

    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Title, content, and beitragstypId are required.",
        }),
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: {
        title,
        content,
        beitragstypId: parseInt(beitragstypId),
        beitragssubtypId: beitragssubtypId ? parseInt(beitragssubtypId) : null,
        editionId: editionId ? parseInt(editionId) : null,
      },
    });

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/articles:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            number: true, // Seleccionar solo el número de la edición
            title: true, // Puedes incluir el título si lo necesitas
          },
        },
      },
      orderBy: { id: "desc" },
    });

    return new Response(JSON.stringify(articles), { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/articles:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

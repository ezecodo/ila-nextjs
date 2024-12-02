import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
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
      orderBy: { id: "desc" },
    });

    return new Response(JSON.stringify(articles), { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/articles:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const {
      title,
      subtitle,
      content,
      beitragstypId,
      beitragssubtypId,
      isPrinted,
      editionId,
      startPage,
      endPage,
      authorId,
      intervieweeId,
    } = await request.json();

    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Título, contenido y tipo de artículo son obligatorios.",
        }),
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: {
        title,
        subtitle,
        content,
        beitragstypId: parseInt(beitragstypId, 10),
        beitragssubtypId: beitragssubtypId
          ? parseInt(beitragssubtypId, 10)
          : null,
        isInPrintEdition: isPrinted,
        editionId: isPrinted ? parseInt(editionId, 10) : null,
        startPage: isPrinted ? parseInt(startPage, 10) : null,
        endPage: isPrinted ? parseInt(endPage, 10) : null,
        authors: authorId
          ? {
              connect: { id: parseInt(authorId, 10) },
            }
          : undefined,
        interviewees: intervieweeId
          ? {
              connect: { id: parseInt(intervieweeId, 10) },
            }
          : undefined,
      },
    });

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    console.error("Error al crear el artículo:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

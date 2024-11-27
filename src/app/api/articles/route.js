import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const {
      title,
      subtitle,
      content,
      beitragstypId,
      beitragssubtypId,
      editionId,
      isPrinted,
      startPage,
      endPage,
    } = await req.json();

    console.log("Datos recibidos:", {
      title,
      subtitle,
      content,
      beitragstypId,
      beitragssubtypId,
      editionId,
      isPrinted,
      startPage,
      endPage,
    });

    // Validaciones básicas
    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Title, content, and beitragstypId are required.",
        }),
        { status: 400 }
      );
    }

    // Validaciones para edición impresa
    if (isPrinted) {
      if (!editionId) {
        return new Response(
          JSON.stringify({ error: "Edition ID is required when printed." }),
          { status: 400 }
        );
      }
      if (startPage === undefined || endPage === undefined) {
        return new Response(
          JSON.stringify({ error: "Start page and end page are required." }),
          { status: 400 }
        );
      }

      const start = parseInt(startPage, 10);
      const end = parseInt(endPage, 10);

      if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0) {
        return new Response(
          JSON.stringify({
            error: "Start and end pages must be positive numbers.",
          }),
          { status: 400 }
        );
      }

      if (start > end) {
        return new Response(
          JSON.stringify({
            error: "Start page cannot be greater than end page.",
          }),
          { status: 400 }
        );
      }
    }

    // Crear artículo
    const article = await prisma.article.create({
      data: {
        title,
        subtitle, // Incluir subtítulo
        content,
        beitragstypId: parseInt(beitragstypId, 10),
        beitragssubtypId: beitragssubtypId
          ? parseInt(beitragssubtypId, 10)
          : null,
        editionId: isPrinted ? parseInt(editionId, 10) : null,
        startPage: isPrinted ? parseInt(startPage, 10) : null,
        endPage: isPrinted ? parseInt(endPage, 10) : null,
      },
    });

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/articles:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const {
      title,
      content,
      beitragstypId,
      beitragssubtypId,
      editionId,
      isPrinted,
    } = await req.json();

    // Log detallado para depuración
    console.log("Datos recibidos en el POST:", {
      title,
      content,
      beitragstypId,
      beitragssubtypId,
      editionId,
      isPrinted,
    });

    // Validar datos obligatorios
    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Title, content, and beitragstypId are required.",
        }),
        { status: 400 }
      );
    }

    // Validar lógica de edición impresa
    if (isPrinted && !editionId) {
      return new Response(
        JSON.stringify({
          error:
            "Edition ID is required when the article is marked as printed.",
        }),
        { status: 400 }
      );
    }

    // Log antes de la creación
    console.log("Preparando datos para crear el artículo:", {
      title,
      content,
      beitragstypId: parseInt(beitragstypId),
      beitragssubtypId: beitragssubtypId ? parseInt(beitragssubtypId) : null,
      editionId: isPrinted ? parseInt(editionId) : null,
    });

    // Crear el artículo
    const article = await prisma.article.create({
      data: {
        title,
        content,
        beitragstypId: parseInt(beitragstypId),
        beitragssubtypId: beitragssubtypId ? parseInt(beitragssubtypId) : null,
        editionId: isPrinted ? parseInt(editionId) : null,
      },
    });

    // Log después de la creación
    console.log("Artículo creado con éxito:", article);

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
            number: true,
            title: true,
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

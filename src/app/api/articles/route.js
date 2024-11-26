import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { title, content, beitragstypId, beitragssubtypId } =
      await req.json();

    // Validar los datos obligatorios
    if (!title || !content || !beitragstypId) {
      return new Response(
        JSON.stringify({
          error: "Title, content, and beitragstypId are required.",
        }),
        { status: 400 }
      );
    }

    // Crear el artículo
    const article = await prisma.article.create({
      data: {
        title,
        content,
        beitragstypId: parseInt(beitragstypId),
        beitragssubtypId: beitragssubtypId ? parseInt(beitragssubtypId) : null,
      },
    });

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/articles:", error);

    // Respuesta en caso de error
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
    // Obtener artículos ordenados por ID descendente
    const articles = await prisma.article.findMany({
      include: {
        beitragstyp: true, // Incluir detalles del tipo
        beitragssubtyp: true, // Incluir detalles del subtipo si existe
      },
      orderBy: { id: "desc" },
    });

    return new Response(JSON.stringify(articles), { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/articles:", error);

    // Respuesta en caso de error
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

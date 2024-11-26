import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { title, content } = await req.json();

    // Validar los datos
    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: "Title and content are required" }),
        { status: 400 }
      );
    }

    // Crear el artículo
    const article = await prisma.article.create({
      data: { title, content },
    });

    return new Response(JSON.stringify(article), { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/articles:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { id: "desc" },
    });

    return new Response(JSON.stringify(articles), { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/articles:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

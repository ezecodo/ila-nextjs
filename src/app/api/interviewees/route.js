import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Manejo del método GET
export async function GET() {
  try {
    const interviewees = await prisma.interviewee.findMany({
      select: {
        id: true,
        name: true,
        articles: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    return new Response(JSON.stringify(interviewees), { status: 200 });
  } catch (error) {
    console.error("Error al obtener los entrevistados:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

// Manejo del método POST
export async function POST(request) {
  try {
    const { name, articleId } = await request.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: "El nombre del entrevistado es obligatorio." }),
        { status: 400 }
      );
    }

    // Verifica si el entrevistado ya existe
    let interviewee = await prisma.interviewee.findUnique({
      where: { name },
    });

    if (!interviewee) {
      // Crea un nuevo entrevistado si no existe
      interviewee = await prisma.interviewee.create({
        data: { name },
      });
    }

    // Relaciona el entrevistado con el artículo si `articleId` es proporcionado
    if (articleId) {
      await prisma.article.update({
        where: { id: parseInt(articleId, 10) },
        data: {
          interviewees: {
            connect: { id: interviewee.id },
          },
        },
      });
    }

    return new Response(JSON.stringify(interviewee), { status: 201 });
  } catch (error) {
    console.error("Error al crear el entrevistado:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500 }
    );
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      orderBy: { name: "asc" }, // Ordenar alfabéticamente
    });
    return new Response(JSON.stringify(authors), { status: 200 });
  } catch (error) {
    console.error("Error al obtener autores:", error);
    return new Response(
      JSON.stringify({
        error: "Error al obtener autores",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { name, email } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: "El nombre del autor es obligatorio." }),
        { status: 400 }
      );
    }

    // Crear el autor en la base de datos
    const newAuthor = await prisma.author.create({
      data: {
        name,
        email: email || null, // El email es opcional
      },
    });

    // Devolver el autor recién creado
    return new Response(JSON.stringify(newAuthor), { status: 201 });
  } catch (error) {
    console.error("Error al agregar autor:", error);
    return new Response(
      JSON.stringify({
        error: "Error al agregar autor",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

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
    // Verificar que el cuerpo de la solicitud contiene datos
    if (!req.body) {
      return new Response(
        JSON.stringify({ error: "Cuerpo de la solicitud vacío." }),
        { status: 400 }
      );
    }

    // Leer datos del cuerpo de la solicitud
    const body = await req.json();
    console.log("Datos recibidos:", body);

    const { name, email, bio, location, role, regions, topics } = body;

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
        email: email || null, // Manejar email opcional
        bio: bio || null, // Manejar bio opcional
        location: location || null, // Manejar location opcional
        role: role || null, // Manejar role opcional
      },
    });

    if (!newAuthor) {
      throw new Error("Error al crear el autor en la base de datos.");
    }

    console.log("Nuevo autor creado:", newAuthor);

    return new Response(JSON.stringify(newAuthor), { status: 201 });
  } catch (error) {
    console.error("Error al agregar autor:", error);

    // Asegurarse de manejar errores que no sean JSON
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    return new Response(
      JSON.stringify({
        error: "Error al agregar autor",
        details: errorMessage,
      }),
      { status: 500 }
    );
  }
}

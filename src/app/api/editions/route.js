import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const editions = await prisma.edition.findMany({
      orderBy: { datePublished: "desc" }, // Ordena por fecha de publicación descendente
    });

    if (!editions || editions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontraron ediciones" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(editions), { status: 200 });
  } catch (error) {
    console.error("Error en el endpoint /api/ediciones:", error);
    return new Response(
      JSON.stringify({ error: "Error al cargar ediciones" }),
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

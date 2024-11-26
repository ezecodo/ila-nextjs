import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Obtener los Beitragstypen junto con sus subtipos
    const beitragstypen = await prisma.beitragstyp.findMany({
      include: { subtypes: true }, // Incluir subtipos en la respuesta
    });

    // Verificar si los datos están presentes
    if (!beitragstypen || beitragstypen.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se encontraron tipos de artículos." }),
        {
          status: 404,
        }
      );
    }

    return new Response(JSON.stringify(beitragstypen), { status: 200 });
  } catch (error) {
    console.error("Error en el endpoint /api/beitragstypen:", error);
    return new Response(
      JSON.stringify({ error: "Error al cargar los tipos de artículo" }),
      {
        status: 500,
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}

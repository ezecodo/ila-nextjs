import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

export async function GET() {
  try {
    const categories = await prisma.category.findMany();
    return new Response(JSON.stringify(categories), { status: 200 });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return new Response(
      JSON.stringify({ error: "Error al obtener categorías." }),
      { status: 500 }
    );
  }
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return new Response(JSON.stringify(authors), { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/authors:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}

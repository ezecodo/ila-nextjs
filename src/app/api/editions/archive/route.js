import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const editions = await prisma.edition.findMany({
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        titleES: true,
        coverImage: true,
        datePublished: true, // ✅ Este es el campo correcto
        _count: {
          select: { articles: true },
        },
      },
    });

    return new Response(JSON.stringify(editions), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching archive editions:", error);
    return new Response(
      JSON.stringify({ error: "Error fetching archive editions" }),
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lista de autores con al menos un artículo, ordenados por cantidad (desc).
// Como hay muchos, soporta búsqueda por nombre (?q=) y va capada.
// Alimenta el selector "por autor" de GLOBila (search-driven).
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    const authors = await prisma.author.findMany({
      where: {
        articles: { some: {} },
        ...(q ? { name: { contains: q } } : {}),
      },
      select: {
        id: true,
        name: true,
        _count: { select: { articles: true } },
      },
      orderBy: { articles: { _count: "desc" } },
      take: q ? 80 : 200,
    });

    const data = authors.map((a) => ({
      id: a.id,
      name: a.name,
      nameES: null,
      count: a._count.articles,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error listando autores:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

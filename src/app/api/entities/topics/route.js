import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lista plana de temas que tienen al menos un artículo, ordenados por cantidad
// de artículos (desc). Alimenta el selector de temas de GLOBila. Distinto del
// /api/topics, que devuelve un árbol jerárquico pensado para el dashboard.
export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      where: { articles: { some: {} } },
      select: {
        id: true,
        name: true,
        nameES: true,
        _count: { select: { articles: true } },
      },
      orderBy: { articles: { _count: "desc" } },
    });

    const data = topics.map((t) => ({
      id: t.id,
      name: t.name,
      nameES: t.nameES,
      count: t._count.articles,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error listando temas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

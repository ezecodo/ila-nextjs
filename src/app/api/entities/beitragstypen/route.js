import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Lista plana de tipos de artículo (Beitragstyp) con al menos un artículo,
// ordenados por cantidad (desc). Alimenta el selector "por tipo" de GLOBila.
export async function GET() {
  try {
    const types = await prisma.beitragstyp.findMany({
      where: { articles: { some: {} } },
      select: {
        id: true,
        name: true,
        nameES: true,
        _count: { select: { articles: true } },
      },
      orderBy: { articles: { _count: "desc" } },
    });

    const data = types.map((t) => ({
      id: t.id,
      name: t.name,
      nameES: t.nameES,
      count: t._count.articles,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error listando tipos de artículo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

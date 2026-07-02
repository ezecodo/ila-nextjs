import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Heatmap combinado de GLOBila: cuenta cuántos artículos toca cada región
// aplicando a la vez los filtros de tema, tipo y autor (AND).
// Params: ?topicId= &typeId= &authorId= (todos opcionales, al menos uno).
// → { regions: [{ id, name, nameES, count }], total }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = parseInt(searchParams.get("topicId") || "", 10);
    const typeId = parseInt(searchParams.get("typeId") || "", 10);
    const authorId = parseInt(searchParams.get("authorId") || "", 10);

    const where = {};
    if (!isNaN(topicId)) where.topics = { some: { id: topicId } };
    if (!isNaN(typeId)) where.beitragstypId = typeId;
    if (!isNaN(authorId)) where.authors = { some: { id: authorId } };

    // Sin ningún filtro no tiene sentido escanear todo el archivo.
    if (Object.keys(where).length === 0) {
      return NextResponse.json({ regions: [], total: 0 });
    }

    const articles = await prisma.article.findMany({
      where,
      select: { regions: { select: { id: true, name: true, nameES: true } } },
    });

    const tally = new Map();
    for (const a of articles) {
      for (const r of a.regions) {
        const prev = tally.get(r.id);
        if (prev) prev.count += 1;
        else tally.set(r.id, { id: r.id, name: r.name, nameES: r.nameES, count: 1 });
      }
    }

    const regions = [...tally.values()].sort((a, b) => b.count - a.count);

    return NextResponse.json({ regions, total: articles.length });
  } catch (error) {
    console.error("❌ Error conteo explore por región:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

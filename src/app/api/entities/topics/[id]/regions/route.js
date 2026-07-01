import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dado un tema, devuelve cuántos artículos de ese tema toca cada región.
// GLOBila usa esto para "encender" los países donde el tema tiene cobertura,
// dimensionados por cantidad.
// → { topic: { id, name, nameES }, regions: [{ id, name, nameES, count }], total }
export async function GET(request, context) {
  try {
    const params = await context?.params;
    const topicId = parseInt(params?.id, 10);
    if (isNaN(topicId)) {
      return NextResponse.json({ error: "ID de tema inválido" }, { status: 400 });
    }

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, name: true, nameES: true },
    });
    if (!topic) {
      return NextResponse.json({ error: "Tema no encontrado" }, { status: 404 });
    }

    // Traer las regiones de cada artículo del tema y tabular en memoria.
    // Volumen acotado (un tema rara vez supera unos cientos de artículos).
    const articles = await prisma.article.findMany({
      where: { topics: { some: { id: topicId } } },
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

    return NextResponse.json({ topic, regions, total: articles.length });
  } catch (error) {
    console.error("❌ Error conteo de tema por región:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

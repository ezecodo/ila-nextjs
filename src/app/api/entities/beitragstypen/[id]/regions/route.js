import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dado un tipo de artículo (Beitragstyp), devuelve cuántos artículos de ese
// tipo toca cada región. GLOBila lo usa para "encender" los países.
// → { type: { id, name, nameES }, regions: [{ id, name, nameES, count }], total }
export async function GET(request, context) {
  try {
    const params = await context?.params;
    const typeId = parseInt(params?.id, 10);
    if (isNaN(typeId)) {
      return NextResponse.json({ error: "ID de tipo inválido" }, { status: 400 });
    }

    const type = await prisma.beitragstyp.findUnique({
      where: { id: typeId },
      select: { id: true, name: true, nameES: true },
    });
    if (!type) {
      return NextResponse.json({ error: "Tipo no encontrado" }, { status: 404 });
    }

    const articles = await prisma.article.findMany({
      where: { beitragstypId: typeId },
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

    return NextResponse.json({ type, regions, total: articles.length });
  } catch (error) {
    console.error("❌ Error conteo de tipo por región:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

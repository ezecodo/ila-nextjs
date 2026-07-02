import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dado un autor, devuelve cuántos de sus artículos toca cada región.
// GLOBila lo usa para "encender" los países que cubrió ese autor.
// → { author: { id, name }, regions: [{ id, name, nameES, count }], total }
export async function GET(request, context) {
  try {
    const params = await context?.params;
    const authorId = parseInt(params?.id, 10);
    if (isNaN(authorId)) {
      return NextResponse.json({ error: "ID de autor inválido" }, { status: 400 });
    }

    const author = await prisma.author.findUnique({
      where: { id: authorId },
      select: { id: true, name: true },
    });
    if (!author) {
      return NextResponse.json({ error: "Autor no encontrado" }, { status: 404 });
    }

    const articles = await prisma.article.findMany({
      where: { authors: { some: { id: authorId } } },
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

    return NextResponse.json({ author, regions, total: articles.length });
  } catch (error) {
    console.error("❌ Error conteo de autor por región:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

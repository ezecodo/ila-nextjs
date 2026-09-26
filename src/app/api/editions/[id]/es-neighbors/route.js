import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Dossier anterior/posterior (por número) que tenga al menos un artículo
// visible en español — lo usan las flechas de /editions/[id]/es para
// recorrer el archivo en español sin caer en dossiers vacíos.
// Mismo criterio de "visible en ES" que /api/articles/filtered?locale=es.
function esArticleWhere() {
  return {
    isPublished: true,
    isTranslatedES: true,
    needsReviewES: false,
    OR: [{ publicationDate: null }, { publicationDate: { lte: new Date() } }],
  };
}

async function findNeighbor(number, direction) {
  const articleWhere = esArticleWhere();
  const edition = await prisma.edition.findFirst({
    where: {
      number: direction === "prev" ? { lt: number } : { gt: number },
      isPublished: true,
      articles: { some: articleWhere },
    },
    orderBy: { number: direction === "prev" ? "desc" : "asc" },
    select: {
      id: true,
      number: true,
      title: true,
      titleES: true,
      _count: { select: { articles: { where: articleWhere } } },
    },
  });
  if (!edition) return null;
  const { _count, ...rest } = edition;
  return { ...rest, esCount: _count.articles };
}

export async function GET(req, context) {
  try {
    const { id } = await context.params;
    const editionId = parseInt(id, 10);
    if (isNaN(editionId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const current = await prisma.edition.findUnique({
      where: { id: editionId },
      select: { number: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Edición no encontrada" }, { status: 404 });
    }

    const [prev, next] = await Promise.all([
      findNeighbor(current.number, "prev"),
      findNeighbor(current.number, "next"),
    ]);

    return NextResponse.json({ prev, next });
  } catch (error) {
    console.error("❌ Error en es-neighbors:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

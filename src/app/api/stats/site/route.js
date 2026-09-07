// app/api/stats/site/route.js
// Contadores globales del sitio para el banner tipo "stats" (slideshow del sidebar de edición)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // 5 min — son conteos pesados de todo el archivo, no hace falta calcularlos en cada visita

// ila publica su primer número en 1976 — usado para el contador "años de historia"
const FOUNDING_YEAR = 1976;

export async function GET() {
  try {
    const [articles, editions, translatedEs, authors, regions, topics] =
      await Promise.all([
        prisma.article.count({ where: { isPublished: true } }),
        prisma.edition.count(),
        prisma.article.count({
          where: { isPublished: true, isTranslatedES: true },
        }),
        prisma.author.count(),
        prisma.region.count(),
        prisma.topic.count(),
      ]);
    const yearsActive = new Date().getFullYear() - FOUNDING_YEAR;

    return NextResponse.json(
      { articles, editions, translatedEs, authors, regions, topics, yearsActive },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    console.error("❌ Error en /api/stats/site:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

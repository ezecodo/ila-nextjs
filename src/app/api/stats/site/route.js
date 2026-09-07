// app/api/stats/site/route.js
// Contadores globales del sitio para el banner tipo "stats" (slideshow del sidebar de edición)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sin cache: son 6 COUNT() sobre tablas chicas (~5100 artículos, 355
// dossiers, el resto todavía menos) — milisegundos en MySQL, no hace falta
// amortizarlos. Antes tenía 5 min de cache (revalidate + Cache-Control) para
// "no calcularlos en cada visita", pero a este volumen de datos el ahorro no
// vale la pena frente a mostrar siempre el número real (pedido explícito:
// que el banner refleje contenido recién publicado, no algo de hace rato).
export const dynamic = "force-dynamic";

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

    // no-store explícito: sin esto, el cache PRIVADO del navegador (el único
    // cache real acá — SlideBanner.jsx/banners/page.jsx hacen fetch() plano
    // desde el cliente) puede quedarse con una respuesta vieja por su cuenta
    // aunque el servidor ya no la esté cacheando.
    return NextResponse.json(
      { articles, editions, translatedEs, authors, regions, topics, yearsActive },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("❌ Error en /api/stats/site:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

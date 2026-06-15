import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { TARGET_PER_DOSSIER } from "@/lib/redaktionStats";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Todos los dossiers con su cantidad de artículos (scrollable en el cliente).
    const editions = await prisma.edition.findMany({
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        titleES: true,
        _count: { select: { articles: true } },
      },
    });

    const dossiers = editions.map((e) => ({
      id: e.id,
      number: e.number,
      title: e.title,
      titleES: e.titleES,
      articleCount: e._count.articles,
    }));

    // Backlog: lo que falta para que cada dossier llegue a TARGET_PER_DOSSIER.
    const backlogRemaining = dossiers.reduce(
      (s, d) => s + Math.max(0, TARGET_PER_DOSSIER - d.articleCount),
      0
    );

    // Artículos de dossier ingresados por mes (ritmo de carga).
    const logs = await prisma.activityLog.findMany({
      where: { action: "CREATE_ARTICLE" },
      select: {
        createdAt: true,
        article: { select: { editionId: true } },
      },
    });

    const monthlyMap = new Map();
    for (const log of logs) {
      if (!log.article?.editionId) continue; // online o artículo borrado: no cuenta para dossiers
      const key = `${log.createdAt.getFullYear()}-${String(
        log.createdAt.getMonth() + 1
      ).padStart(2, "0")}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
    }

    const monthly = [...monthlyMap.entries()]
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({ dossiers, monthly, backlogRemaining });
  } catch (error) {
    console.error("❌ Error content-stats:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// GET — lista los artículos publicados del dossier con su prioridad actual
// Orden: prioridad > 0 primero (asc), luego el resto por fecha de publicación desc
export async function GET(_req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const editionId = Number(id);

    const articles = await prisma.article.findMany({
      where: { editionId, isPublished: true },
      orderBy: { publicationDate: "desc" },
      select: {
        id: true,
        title: true,
        titleES: true,
        beitragsId: true,
        frontpagePriority: true,
        publicationDate: true,
        authors: { select: { id: true, name: true } },
      },
    });

    const withImages = await Promise.all(
      articles.map(async (a) => {
        const img = await prisma.image.findFirst({
          where: {
            contentType: "ARTICLE",
            contentId: { in: [a.beitragsId, a.id].filter(Boolean) },
          },
          select: { url: true },
        });
        return { ...a, imageUrl: img?.url || null };
      }),
    );

    // prioridad > 0 primero (asc); el resto conserva el orden por fecha desc
    const prio = (a) =>
      Number(a.frontpagePriority) > 0 ? Number(a.frontpagePriority) : Infinity;
    withImages.sort((a, b) => prio(a) - prio(b));

    return NextResponse.json(withImages);
  } catch (error) {
    console.error("❌ Error GET article-priority:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT — guarda el nuevo orden. body: { order: [articleId, ...] } (primero = arriba)
// Asigna frontpagePriority = índice+1 a los enviados; el resto del dossier vuelve a 0.
export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const editionId = Number(id);
    const { order } = await req.json();

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: "order inválido" }, { status: 400 });
    }

    const orderedIds = order.map((n) => Number(n)).filter((n) => !Number.isNaN(n));

    await prisma.$transaction([
      // reset de todo el dossier
      prisma.article.updateMany({
        where: { editionId },
        data: { frontpagePriority: 0 },
      }),
      // asignar prioridades 1..N en el orden recibido
      ...orderedIds.map((articleId, idx) =>
        prisma.article.update({
          where: { id: articleId },
          data: { frontpagePriority: idx + 1 },
        }),
      ),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error PUT article-priority:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

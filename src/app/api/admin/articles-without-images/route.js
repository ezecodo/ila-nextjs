import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// Herramienta "Artikel ohne Bild" (/dashboard/admin/fehlende-bilder).
// "Sin imagen" = sin imagen principal (Image contentType "ARTICLE"); las
// imágenes insertadas en el cuerpo (ARTICLE_INLINE) no cuentan. El contentId
// de la imagen es beitragsId || id (mismo criterio que el resto del sitio).
//
// GET                → dossiers con cuántos artículos sin imagen tiene cada uno
// GET ?editionId=123 → los artículos sin imagen de ese dossier + su PDF
export async function GET(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const editionIdParam = new URL(req.url).searchParams.get("editionId");
    const editionId = editionIdParam ? parseInt(editionIdParam, 10) : null;

    const articles = await prisma.article.findMany({
      where: editionId ? { editionId } : { editionId: { not: null } },
      select: {
        id: true,
        beitragsId: true,
        editionId: true,
        title: true,
        startPage: true,
        endPage: true,
        isPublished: true,
        legacyPath: true,
      },
    });

    const contentIds = articles.map((a) => a.beitragsId || a.id);
    const withImage = new Set(
      (
        await prisma.image.findMany({
          where: { contentType: "ARTICLE", contentId: { in: contentIds } },
          select: { contentId: true },
          distinct: ["contentId"],
        })
      ).map((i) => i.contentId)
    );
    const missing = articles.filter((a) => !withImage.has(a.beitragsId || a.id));

    if (!editionId) {
      const countByEdition = new Map();
      for (const a of missing) {
        countByEdition.set(a.editionId, (countByEdition.get(a.editionId) || 0) + 1);
      }
      const editions = await prisma.edition.findMany({
        orderBy: { number: "desc" },
        select: {
          id: true,
          number: true,
          title: true,
          pdf: { select: { pdfUrl: true } },
        },
      });
      return NextResponse.json(
        editions.map((e) => ({
          id: e.id,
          number: e.number,
          title: e.title,
          hasPdf: !!e.pdf?.pdfUrl,
          missingCount: countByEdition.get(e.id) || 0,
        }))
      );
    }

    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      select: {
        id: true,
        number: true,
        title: true,
        pdf: { select: { pdfUrl: true } },
      },
    });
    if (!edition) {
      return NextResponse.json({ error: "Edición no encontrada" }, { status: 404 });
    }

    // Por página (los sin página al final), así se recorre el PDF en orden.
    missing.sort((a, b) => {
      if (a.startPage == null && b.startPage == null) return a.title.localeCompare(b.title);
      if (a.startPage == null) return 1;
      if (b.startPage == null) return -1;
      return a.startPage - b.startPage;
    });

    return NextResponse.json({
      edition: {
        id: edition.id,
        number: edition.number,
        title: edition.title,
        pdfUrl: edition.pdf?.pdfUrl || null,
      },
      articles: missing.map((a) => ({
        id: a.id,
        title: a.title,
        startPage: a.startPage,
        endPage: a.endPage,
        isPublished: a.isPublished,
        legacyPath: a.legacyPath,
      })),
    });
  } catch (error) {
    console.error("❌ Error en articles-without-images:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

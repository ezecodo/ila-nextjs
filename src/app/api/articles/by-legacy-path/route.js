import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { hasAboAccess } from "@/lib/aboAccess";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) {
    return new Response(JSON.stringify({ error: "Falta parámetro path" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const article = await prisma.article.findFirst({
      where: {
        legacyPath: path,
      },
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            id: true,
            number: true,
            title: true,
            titleES: true,
            coverImage: true,
            isAvailableToOrder: true,
            isSpecialOffer: true,
            isPublished: true,
            translatorId: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
            _count: { select: { articles: true } },
          },
        },
        interviewees: {
          select: {
            id: true,
            name: true,
          },
        },
        translator: {
          select: {
            id: true,
            name: true,
          },
        },
        categories: true,
        regions: true,
        topics: true,
      },
    });

    if (!article) {
      return new Response(JSON.stringify({ error: "Artículo no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let exclusivePreview = false;
    const editionDraft = !!article.edition && !article.edition.isPublished;

    if (editionDraft || !article.isPublished) {
      const session = await auth();
      const role = session?.user?.role;
      const userId = session?.user?.id;

      // 🔒 Dossier en borrador: mientras el Dossier no se publique, TODOS sus
      // artículos quedan ocultos (aunque el artículo en sí ya esté isPublished,
      // que es justo el caso que habilita este gate: cargarlos de antemano sin
      // que se vean sueltos) — salvo admin o el traductor asignado al dossier.
      if (editionDraft) {
        const hasEditionAccess =
          role === "admin" || article.edition?.translatorId === userId;
        if (!hasEditionAccess) {
          return new Response(
            JSON.stringify({ error: "Artículo no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        exclusivePreview = true;
      }

      // 🔒 Acceso anticipado: los artículos no publicados solo son visibles
      // para admins y suscriptores Digital ABO (acceso exclusivo a contenido
      // programado).
      if (!article.isPublished) {
        // Admin ve todo el contenido no publicado; los demás con acceso ABO
        // (traductores y abonados) solo los artículos programados (con fecha fijada).
        const allowed =
          role === "admin" ||
          ((await hasAboAccess(session)) && !!article.publicationDate);

        if (!allowed) {
          return new Response(
            JSON.stringify({ error: "Artículo no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        exclusivePreview = true;
      }
    }

    // No exponer el id del traductor asignado a la edición (uso interno del gate arriba)
    if (article.edition) delete article.edition.translatorId;

    const contentIdToUse = article.beitragsId || article.id;

    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: contentIdToUse,
      },
    });

    const pdfs = await prisma.articlePdf.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: "asc" },
    });

    return new Response(
      JSON.stringify({
        ...article,
        images,
        pdfs,
        interviewees: article.interviewees || [],
        exclusivePreview,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en by-legacy-path:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

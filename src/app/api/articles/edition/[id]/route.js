import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { hasAboAccess } from "@/lib/aboAccess";

export async function GET(req, context) {
  const params = await context.params;
  const { id } = params;

  const editionNumber = parseInt(id);

  if (!editionNumber || isNaN(editionNumber)) {
    return new Response(
      JSON.stringify({ error: "Número de edición inválido" }),
      { status: 400 },
    );
  }

  try {
    const edition = await prisma.edition.findUnique({
      where: { number: editionNumber },
    });

    if (!edition) {
      return new Response(JSON.stringify({ error: "Edición no encontrada" }), {
        status: 404,
      });
    }

    // 🔥 CAMBIO: Usar final del día en vez de hora actual
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Artículos publicos: publicados y cuya fecha ya llegó.
    const publishedAndDue = {
      isPublished: true,
      OR: [{ publicationDate: null }, { publicationDate: { lte: today } }],
    };

    // 🔒 Acceso anticipado: admins ven todo el dossier; los suscriptores
    // Digital ABO ven además los artículos programados (con fecha futura).
    const session = await auth();
    const role = session?.user?.role;

    let where;
    if (role === "admin") {
      where = { editionId: edition.id };
    } else {
      // Traductores y abonados (acceso ABO) ven además los artículos programados.
      const allowed = await hasAboAccess(session);
      where = allowed
        ? {
            editionId: edition.id,
            OR: [
              publishedAndDue,
              { isPublished: false, publicationDate: { not: null } },
            ],
          }
        : { editionId: edition.id, ...publishedAndDue };
    }

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        beitragsId: true,
        title: true,
        titleES: true,
        subtitle: true,
        subtitleES: true,
        isTranslatedES: true,
        legacyPath: true,
        isPublished: true,
        publicationDate: true,
        authors: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        publicationDate: "asc",
      },
    });

    // 🖼️ Miniatura: las imágenes viven en tabla aparte, indexadas por
    // contentId = beitragsId || id. Una sola query para todos los artículos.
    const contentIds = articles.map((a) => a.beitragsId || a.id);
    const images = contentIds.length
      ? await prisma.image.findMany({
          where: { contentType: "ARTICLE", contentId: { in: contentIds } },
          select: { contentId: true, url: true, alt: true, altES: true },
          orderBy: { id: "asc" },
        })
      : [];

    const imageByContentId = new Map();
    for (const img of images) {
      if (!imageByContentId.has(img.contentId)) {
        imageByContentId.set(img.contentId, img);
      }
    }

    const articlesWithImage = articles.map(({ beitragsId, ...rest }) => {
      const img = imageByContentId.get(beitragsId || rest.id) || null;
      return {
        ...rest,
        image: img ? { url: img.url, alt: img.alt, altES: img.altES } : null,
      };
    });

    return new Response(JSON.stringify(articlesWithImage), {
      status: 200,
    });
  } catch (error) {
    console.error("Error en /api/articles/edition/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500 },
    );
  }
}

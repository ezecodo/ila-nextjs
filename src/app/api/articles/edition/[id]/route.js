import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

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
    const email = session?.user?.email;

    let where;
    if (role === "admin") {
      where = { editionId: edition.id };
    } else {
      let hasPdfAbo = false;
      if (email) {
        const invitation = await prisma.pdfAboInvitation.findUnique({
          where: { email: email.toLowerCase() },
          select: { isRedeemed: true, endDate: true },
        });
        hasPdfAbo =
          !!invitation &&
          invitation.isRedeemed &&
          (!invitation.endDate || invitation.endDate > new Date());
      }

      where = hasPdfAbo
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

    return new Response(JSON.stringify(articles), {
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

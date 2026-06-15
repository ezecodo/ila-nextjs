import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

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

    // 🔒 Acceso anticipado: los artículos no publicados solo son visibles para
    // admins y suscriptores Digital ABO (acceso exclusivo a contenido programado).
    let exclusivePreview = false;
    if (!article.isPublished) {
      const session = await auth();
      const role = session?.user?.role;
      const email = session?.user?.email;

      let allowed = false;
      if (role === "admin") {
        allowed = true;
      } else if (email) {
        const invitation = await prisma.pdfAboInvitation.findUnique({
          where: { email: email.toLowerCase() },
          select: { isRedeemed: true, endDate: true },
        });
        const hasPdfAbo =
          !!invitation &&
          invitation.isRedeemed &&
          (!invitation.endDate || invitation.endDate > new Date());
        // El ABO accede a artículos programados (con fecha de publicación fijada).
        allowed = hasPdfAbo && !!article.publicationDate;
      }

      if (!allowed) {
        return new Response(
          JSON.stringify({ error: "Artículo no encontrado" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      exclusivePreview = true;
    }

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

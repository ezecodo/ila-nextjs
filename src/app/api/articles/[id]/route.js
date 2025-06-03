import { prisma } from "@/lib/prisma";

export async function GET(req, context) {
  const params = await context.params;
  const id = params?.id;

  if (!id) {
    return new Response(JSON.stringify({ error: "ID no proporcionado" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (isNaN(parseInt(id))) {
      return new Response(JSON.stringify({ error: "ID no válido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener el artículo con todos los campos necesarios
    const article = await prisma.article.findUnique({
      where: { id: parseInt(id) },
      include: {
        beitragstyp: true,
        beitragssubtyp: true,
        edition: {
          select: {
            id: true,
            number: true,
            title: true,
            coverImage: true,
          },
        },
        authors: {
          select: {
            id: true,
            name: true,
            _count: { select: { articles: true } },
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // Priorizar beitragsId para las imágenes si existe, sino usar el id del artículo
    const contentIdToUse = article.beitragsId || article.id;

    // Obtener imágenes relacionadas del artículo (o del beitragsId si aplica)
    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: contentIdToUse,
      },
    });

    return new Response(
      JSON.stringify({
        ...article,
        images,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error en GET /api/articles/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Guardar traducción en campos ES
export async function PUT(req, context) {
  const { id } = context.params;

  if (!id || isNaN(parseInt(id))) {
    return new Response(JSON.stringify({ error: "ID no válido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    const updatedArticle = await prisma.article.update({
      where: { id: parseInt(id) },
      data: {
        titleES: body.titleES,
        subtitleES: body.subtitleES,
        contentES: body.contentES,
        previewTextES: body.previewES,
        additionalInfoES: body.additionalInfoES,
        isTranslatedES: true,
        needsReviewES:
          typeof body.needsReviewES === "boolean" ? body.needsReviewES : true, // si no viene nada, lo deja en true
      },
    });

    return new Response(JSON.stringify(updatedArticle), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error al guardar traducción:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno al guardar traducción",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

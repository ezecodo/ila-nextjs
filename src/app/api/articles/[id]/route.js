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
        interviewees: {
          select: {
            id: true,
            name: true,
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
  const { id } = await context.params;

  if (!id || isNaN(parseInt(id))) {
    return new Response(JSON.stringify({ error: "ID no válido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      // 🟢 Caso: Traducción
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
            typeof body.needsReviewES === "boolean" ? body.needsReviewES : true,
        },
      });

      return Response.json(updatedArticle, { status: 200 });
    }

    if (contentType.includes("multipart/form-data")) {
      // 🟠 Caso: Edición con imágenes
      const formData = await req.formData();

      const title = formData.get("title");
      const subtitle = formData.get("subtitle");
      const previewText = formData.get("previewText");
      const content = formData.get("content");
      const additionalInfo = formData.get("additionalInfo");
      let authors = [];
      try {
        const rawAuthors = formData.get("authors");
        if (rawAuthors) {
          authors = JSON.parse(rawAuthors.toString());
        }
      } catch (e) {
        console.error("Error parseando autores:", e);
      }
      let interviewees = [];
      try {
        const rawInterviewees = formData.get("interviewees");
        if (rawInterviewees) {
          interviewees = JSON.parse(rawInterviewees.toString());
        }
      } catch (e) {
        console.error("Error parseando entrevistados:", e);
      }
      const isPrinted = formData.get("isPrinted") === "true";
      const editionId = formData.get("editionId");
      const startPage = formData.get("startPage");
      const endPage = formData.get("endPage");
      const beitragstypId = formData.get("beitragstypId");
      const beitragssubtypId = formData.get("beitragssubtypId");
      let categories = [];
      try {
        const rawCategories = formData.get("categories");
        if (rawCategories) {
          categories = JSON.parse(rawCategories.toString());
        }
      } catch (e) {
        console.error("Error parseando categorías:", e);
      }
      const regions = (() => {
        try {
          return formData.get("regions")
            ? JSON.parse(formData.get("regions"))
            : [];
        } catch (e) {
          console.error("Error parseando regiones:", e);
          return [];
        }
      })();
      const topics = (() => {
        try {
          return formData.get("topics")
            ? JSON.parse(formData.get("topics"))
            : [];
        } catch (e) {
          console.error("Error parseando temas:", e);
          return [];
        }
      })();

      // ⚡️ TODO: procesar file (articleImage) y subir a Cloudinary si existe

      const updatedArticle = await prisma.article.update({
        where: { id: parseInt(id) },
        data: {
          title,
          subtitle,
          previewText: previewText || null,
          content,
          additionalInfo: additionalInfo || null,
          authors: {
            set: authors.map((id) => ({ id: parseInt(id, 10) })),
          },
          interviewees: {
            set: interviewees.map((id) => ({ id: parseInt(id, 10) })),
          },
          isInPrintEdition: isPrinted,
          editionId: editionId ? parseInt(editionId) : null,
          startPage: startPage ? parseInt(startPage) : null,
          endPage: endPage ? parseInt(endPage) : null,
          beitragstypId: beitragstypId ? parseInt(beitragstypId) : null,
          beitragssubtypId: beitragssubtypId
            ? parseInt(beitragssubtypId)
            : null,
          categories: categories.length
            ? {
                set: categories.map((id) => ({ id: parseInt(id, 10) })),
              }
            : undefined,
          regions: {
            set: regions.map((id) => ({ id: parseInt(id, 10) })),
          },
          topics: {
            set: topics.map((id) => ({ id: parseInt(id, 10) })),
          },
          // …añadir otros campos
        },
      });

      return Response.json(updatedArticle, { status: 200 });
    }

    return new Response(
      JSON.stringify({ error: "Tipo de contenido no soportado" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en PUT:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

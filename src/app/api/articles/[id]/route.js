import { prisma } from "@/lib/prisma";
import cloudinary from "cloudinary";
import { auth } from "../../../auth";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
        interviewees: article.interviewees || [],
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
  const session = await auth();
  const userId = session?.user?.id || "system"; // fallback

  if (!id || isNaN(parseInt(id))) {
    return new Response(JSON.stringify({ error: "ID no válido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const contentType = req.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();

      // 🟢 Caso: quitar traductor — limpiamos reviewedAt también
      if (body.unassignTranslator) {
        const updatedArticle = await prisma.article.update({
          where: { id: parseInt(id, 10) },
          data: {
            translator: { disconnect: true },
            assignedAt: null,
            translationStatus: "in_progress",
            reviewedAt: null, // al desasignar no hay revisión válida
          },
        });
        return Response.json(
          {
            ...updatedArticle,
            legacyPath: updatedArticle.legacyPath, // 👈 aseguramos que llega al cliente
          },
          { status: 200 }
        );
      }

      // 🧠 Construimos el objeto de actualización
      const dataToUpdate = {
        titleES: body.titleES,
        subtitleES: body.subtitleES,
        contentES: body.contentES,
        previewTextES: body.previewES,
        additionalInfoES: body.additionalInfoES,
        translationStatus: body.translationStatus,
        isTranslatedES:
          body.translationStatus === "submitted" ||
          body.translationStatus === "approved",
        needsReviewES:
          body.translationStatus === "submitted"
            ? true
            : body.translationStatus === "approved"
              ? false
              : undefined,
      };

      // ✅ reviewedAt SOLO cuando se aprueba
      if (body.translationStatus === "approved") {
        dataToUpdate.reviewedAt = new Date();
      } else if (
        body.translationStatus === "submitted" ||
        body.translationStatus === "in_progress"
      ) {
        // Enviado / En progreso ⇒ no hay revisión válida
        dataToUpdate.reviewedAt = null;
        // (si prefieres no tocar reviewedAt en estos estados, borra la línea anterior)
      }

      const updatedArticle = await prisma.article.update({
        where: { id: parseInt(id, 10) },
        data: dataToUpdate,
      });
      await prisma.activityLog.create({
        data: {
          userId,
          articleId: updatedArticle.id,
          action: "UPDATE_ARTICLE",
          metadata: JSON.stringify({
            title: updatedArticle.title,
            legacyPath: updatedArticle.legacyPath,
          }),
        },
      });

      return Response.json(updatedArticle, { status: 200 });
    }

    if (contentType.includes("multipart/form-data")) {
      // 🟠 Caso: Edición con imágenes
      const formData = await req.formData();
      // IDs de imágenes que se mantienen
      const keepImages = (() => {
        try {
          return formData.get("keepImages")
            ? JSON.parse(formData.get("keepImages"))
            : [];
        } catch (e) {
          console.error("Error parseando keepImages:", e);
          return [];
        }
      })();

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

      // ⚡️ TODO: procesar file (articleImage) y subir a Cloudinary si
      // 🗑️ Eliminar imágenes no incluidas en keepImages
      // ⚡️ Si keepImages está definido (aunque sea vacío), lo usamos
      if (Array.isArray(keepImages)) {
        await prisma.image.deleteMany({
          where: {
            contentType: "ARTICLE",
            contentId: parseInt(id, 10),
            // 👇 solo borrar si hay keepIds
            ...(keepImages.length > 0
              ? { id: { notIn: keepImages.map((n) => parseInt(n, 10)) } }
              : {}),
          },
        });
      }
      // 📤 Procesar nuevas imágenes de la galería
      const galleryIndices = new Set();
      for (const key of formData.keys()) {
        const m = key.match(/^gallery\[(\d+)\]\[(file|title|alt|isCover)\]$/);
        if (m) galleryIndices.add(parseInt(m[1], 10));
      }

      const sortedIdx = Array.from(galleryIndices).sort((a, b) => a - b);

      for (const idx of sortedIdx) {
        const file = formData.get(`gallery[${idx}][file]`);
        const title = formData.get(`gallery[${idx}][title]`) || null;
        const alt = formData.get(`gallery[${idx}][alt]`) || null;
        const imgId = formData.get(`gallery[${idx}][id]`);

        if (file && file.name) {
          // caso: imagen nueva → create
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploadResult = await cloudinary.v2.uploader.upload(
            `data:${file.type};base64,${buffer.toString("base64")}`,
            {
              folder: "ila/articles",
              public_id: `article_${id}_${Date.now()}_${idx}`,
              overwrite: false,
            }
          );

          await prisma.image.create({
            data: {
              contentType: "ARTICLE",
              contentId: parseInt(id, 10),
              url: uploadResult.secure_url,
              title,
              alt,
            },
          });
        } else if (imgId) {
          // caso: imagen existente → update solo title y alt
          await prisma.image.update({
            where: { id: parseInt(imgId, 10) },
            data: { title, alt },
          });
        }
      }
      // 📤 Procesar nuevas imágenes subidas
      const files = formData.getAll("articleImages"); // 👈 clave plural
      for (const file of files) {
        if (file && file.name) {
          const buffer = Buffer.from(await file.arrayBuffer());

          // Subir a Cloudinary
          const uploadResult = await cloudinary.v2.uploader.upload(
            `data:${file.type};base64,${buffer.toString("base64")}`,
            {
              folder: "ila/articles",
              public_id: `article_${id}_${Date.now()}`, // nombre único
              overwrite: false,
            }
          );

          // Buscar metadatos de esta imagen
          const metaRaw = formData.get(`imageMeta_${file.name}`);
          let meta = {};
          try {
            meta = metaRaw ? JSON.parse(metaRaw.toString()) : {};
          } catch (e) {
            console.error("⚠️ Error parseando metadatos de imagen", e);
          }

          // Guardar en BD
          await prisma.image.create({
            data: {
              contentType: "ARTICLE",
              contentId: parseInt(id, 10),
              url: uploadResult.secure_url,
              title: meta.title || null,
              alt: meta.alt || null,
            },
          });
        }
      }

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
      await prisma.activityLog.create({
        data: {
          userId,
          articleId: updatedArticle.id,
          action: "UPDATE_ARTICLE",
          metadata: JSON.stringify({
            title: updatedArticle.title,
            legacyPath: updatedArticle.legacyPath,
          }),
        },
      });
      const images = await prisma.image.findMany({
        where: { contentType: "ARTICLE", contentId: parseInt(id, 10) },
      });

      return Response.json(
        {
          ...updatedArticle,
          images,
        },
        { status: 200 }
      );
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
// Eliminar artículo
export async function DELETE(req, { params }) {
  const { id } = params;

  if (!id || isNaN(parseInt(id))) {
    return new Response(JSON.stringify({ error: "ID no válido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const articleId = parseInt(id, 10);

    // 1️⃣ Verificar que el artículo existe
    const existing = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!existing) {
      return new Response(JSON.stringify({ error: "Artículo no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2️⃣ Obtener imágenes asociadas (como en tu GET)
    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: articleId,
      },
    });

    // 3️⃣ Eliminar imágenes en Cloudinary (ignorar errores si falla alguna)
    for (const image of images) {
      try {
        const match = image.url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
        if (match) {
          await cloudinary.v2.uploader.destroy(match[1]);
        }
      } catch (e) {
        console.warn("⚠️ Error eliminando imagen en Cloudinary:", e);
      }
    }

    // 4️⃣ Desvincular relaciones M:N
    await prisma.article.update({
      where: { id: articleId },
      data: {
        authors: { set: [] },
        categories: { set: [] },
        regions: { set: [] },
        topics: { set: [] },
        interviewees: { set: [] },
      },
    });

    // 5️⃣ Eliminar imágenes de la BD
    await prisma.image.deleteMany({
      where: { contentType: "ARTICLE", contentId: articleId },
    });

    // 6️⃣ Finalmente borrar el artículo
    await prisma.article.delete({ where: { id: articleId } });

    return new Response(JSON.stringify({ ok: true, id: articleId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error en DELETE /api/articles/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

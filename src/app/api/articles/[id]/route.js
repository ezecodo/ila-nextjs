import { prisma } from "@/lib/prisma";
import { auth } from "../../../auth";
import * as Sentry from "@sentry/nextjs";
import { uploadFile, deleteFile } from "@/lib/localUpload";

function getImageSubfolder(editionNumber) {
  return editionNumber
    ? `images/editions/${editionNumber}/articulos`
    : "images/online";
}

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
        translator: {
          select: {
            id: true,
            name: true,
          },
        },
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

    // Obtener imágenes inline y enriquecer con alt/title del HTML del contenido
    const inlineImagesRaw = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE_INLINE",
        contentId: contentIdToUse,
      },
    });

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const inlineImages = inlineImagesRaw.map((img) => {
      const escaped = escapeRegex(img.url);
      const tagMatch = (article.content || "").match(
        new RegExp(`<img[^>]*src="${escaped}"[^>]*>`)
      );
      let alt = img.alt || "";
      let title = img.title || "";
      let style = "";
      if (tagMatch) {
        const tag = tagMatch[0];
        if (!alt) { const m = tag.match(/alt="([^"]*)"/); alt = m?.[1] || ""; }
        if (!title) { const m = tag.match(/title="([^"]*)"/); title = m?.[1] || ""; }
        const sm = tag.match(/style="([^"]*)"/); style = sm?.[1] || "";
      }
      return { ...img, alt, title, style };
    });

    const pdfs = await prisma.articlePdf.findMany({
      where: { articleId: article.id },
      orderBy: { createdAt: "asc" },
    });

    return new Response(
      JSON.stringify({
        ...article,
        images,
        inlineImages,
        pdfs,
        interviewees: article.interviewees || [],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    Sentry.captureException(error);
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
      // 🖼️ Caso: actualizar SOLO metadatos de imágenes (sin tocar estado de traducción)
      if (body.imageTranslationsOnly && body.imageTranslations) {
        for (const [imgId, translations] of Object.entries(
          body.imageTranslations
        )) {
          await prisma.image.update({
            where: { id: parseInt(imgId, 10) },
            data: {
              titleES: translations.titleES || null,
              altES: translations.altES || null,
            },
          });
        }

        // Si el artículo estaba aprobado, marcamos que fue editado tras revisión
        const current = await prisma.article.findUnique({
          where: { id: parseInt(id, 10) },
          select: { translationStatus: true },
        });
        if (current?.translationStatus === "approved") {
          await prisma.article.update({
            where: { id: parseInt(id, 10) },
            data: { editedAfterReview: true },
          });
        }

        // Devolver el artículo (con el flag actualizado si aplica)
        const article = await prisma.article.findUnique({
          where: { id: parseInt(id, 10) },
          include: {
            edition: {
              select: {
                id: true,
                number: true,
                title: true,
                datePublished: true,
              },
            },
          },
        });

        return Response.json(article, { status: 200 });
      }

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

      // 🔎 Estado actual para detectar edición tras revisión
      const currentArticle = await prisma.article.findUnique({
        where: { id: parseInt(id, 10) },
        select: {
          translationStatus: true,
          translationStartedAt: true,
          translatorId: true,
          titleES: true,
          subtitleES: true,
          contentES: true,
          previewTextES: true,
          additionalInfoES: true,
        },
      });

      // 👤 Si quien envía la traducción es admin SIN rol de traductor acoplado
      // (canTranslate=false), no pasa por revisión: se aprueba directo y se le
      // acredita. Un admin con canTranslate=true es parte del equipo de
      // traductores y sigue el flujo normal (submitted → revisión).
      let autoApproveByAdmin = false;
      if (body.translationStatus === "submitted") {
        const actor = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, canTranslate: true },
        });
        if (actor?.role === "admin" && !actor.canTranslate) {
          body.translationStatus = "approved";
          autoApproveByAdmin = true;
        }
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
        // Re-aprobación limpia la marca de edición posterior
        dataToUpdate.editedAfterReview = false;
      } else if (
        body.translationStatus === "submitted" ||
        body.translationStatus === "in_progress"
      ) {
        // Enviado / En progreso ⇒ no hay revisión válida
        dataToUpdate.reviewedAt = null;
        // (si prefieres no tocar reviewedAt en estos estados, borra la línea anterior)
      }

      // 🕒 Inicio real de la traducción: se sella la primera vez que el artículo
      // pasa a "in_progress" y nunca se vuelve a tocar (el reviewer ve cuándo
      // arrancó el traductor, distinto de assignedAt = cuándo se asignó).
      if (
        body.translationStatus === "in_progress" &&
        !currentArticle?.translationStartedAt
      ) {
        dataToUpdate.translationStartedAt = new Date();
      }

      // ✏️ Edición tras revisión: artículo ya estaba "approved" y cambió algún campo ES
      const isAlreadyApproved =
        currentArticle?.translationStatus === "approved";
      const translationFieldsChanged =
        currentArticle &&
        (currentArticle.titleES !== body.titleES ||
          currentArticle.subtitleES !== body.subtitleES ||
          currentArticle.contentES !== body.contentES ||
          currentArticle.previewTextES !== body.previewES ||
          currentArticle.additionalInfoES !== body.additionalInfoES);
      const imageTranslationsTouched =
        body.imageTranslations &&
        Object.keys(body.imageTranslations).length > 0;

      if (
        isAlreadyApproved &&
        body.translationStatus !== "approved" &&
        (translationFieldsChanged || imageTranslationsTouched)
      ) {
        // Mantenemos el artículo como aprobado pero marcamos que fue editado
        dataToUpdate.translationStatus = "approved";
        dataToUpdate.isTranslatedES = true;
        dataToUpdate.needsReviewES = false;
        dataToUpdate.editedAfterReview = true;
        // No tocamos reviewedAt: la fecha de la revisión original sigue siendo válida
        delete dataToUpdate.reviewedAt;
      }

      // 🖊️ Acreditación de la aprobación directa del admin-traductor: figura como
      // revisor y, si el artículo no tenía traductor asignado, también como
      // traductor (para que aparezca "editada por <nombre>" en el artículo).
      if (autoApproveByAdmin) {
        dataToUpdate.reviewerId = userId;
        if (!currentArticle?.translatorId) {
          dataToUpdate.translatorId = userId;
        }
      }

      const updatedArticle = await prisma.article.update({
        where: { id: parseInt(id, 10) },
        data: dataToUpdate,
        include: {
          edition: {
            select: {
              id: true,
              number: true,
              title: true,
              datePublished: true,
            },
          },
        },
      });
      // 🖼️ Actualizar traducciones de imágenes
      if (
        body.imageTranslations &&
        typeof body.imageTranslations === "object"
      ) {
        for (const [imgId, translations] of Object.entries(
          body.imageTranslations
        )) {
          await prisma.image.update({
            where: { id: parseInt(imgId, 10) },
            data: {
              titleES: translations.titleES || null,
              altES: translations.altES || null,
            },
          });
        }

        // Patch contentES: apply translated alt/title to inline image <img> tags
        if (dataToUpdate.contentES) {
          const articleMeta = await prisma.article.findUnique({
            where: { id: parseInt(id, 10) },
            select: { beitragsId: true },
          });
          const cid = articleMeta?.beitragsId || parseInt(id, 10);
          const inlineImgs = await prisma.image.findMany({
            where: { contentType: "ARTICLE_INLINE", contentId: cid },
          });

          let patchedES = dataToUpdate.contentES;
          for (const img of inlineImgs) {
            const trans = body.imageTranslations[String(img.id)];
            if (!trans || (!trans.altES && !trans.titleES)) continue;
            const escaped = img.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            patchedES = patchedES.replace(
              new RegExp(`<img([^>]*src="${escaped}"[^>]*)>`, "g"),
              (_, attrs) => {
                let a = attrs;
                if (trans.altES) {
                  a = a.includes('alt="')
                    ? a.replace(/alt="[^"]*"/, `alt="${trans.altES}"`)
                    : a + ` alt="${trans.altES}"`;
                }
                if (trans.titleES) {
                  a = a.includes('title="')
                    ? a.replace(/title="[^"]*"/, `title="${trans.titleES}"`)
                    : a + ` title="${trans.titleES}"`;
                }
                return `<img${a}>`;
              }
            );
          }
          dataToUpdate.contentES = patchedES;
          // Re-apply the patched contentES to the article
          await prisma.article.update({
            where: { id: parseInt(id, 10) },
            data: { contentES: patchedES },
          });
        }
      }
      if (session?.user?.name !== "eZe") {
        await prisma.activityLog.create({
          data: {
            userId,
            articleId: updatedArticle.id,
            action: "UPDATE_ARTICLE",
            metadata: JSON.stringify({
              title: updatedArticle.title,
              legacyPath: updatedArticle.legacyPath,
              edition: updatedArticle.edition
                ? {
                    id: updatedArticle.edition.id,
                    number: updatedArticle.edition.number,
                    title: updatedArticle.edition.title,
                    datePublished: updatedArticle.edition.datePublished,
                  }
                : null,
            }),
          },
        });
      }

      return Response.json(updatedArticle, { status: 200 });
    }

    if (contentType.includes("multipart/form-data")) {
      // 🟠 Caso: Edición con imágenes
      const formData = await req.formData();
      // 🟢 Publicar Ahora
      const isPublished = formData.get("isPublished") === "true";

      // 🟢 Fecha de publicación
      let publicationDate = formData.get("publicationDate")
        ? new Date(formData.get("publicationDate"))
        : null;

      // Si se marca "Publicar Ahora" y no hay fecha → usar ahora mismo
      if (isPublished && !publicationDate) {
        publicationDate = new Date();
      }
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
      const contentES = formData.get("contentES") || null;
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
      // 🔍 Obtener el artículo para saber si tiene beitragsId y edición
      const article = await prisma.article.findUnique({
        where: { id: parseInt(id, 10) },
        select: {
          beitragsId: true,
          edition: { select: { number: true } },
        },
      });

      const contentIdToUse = article?.beitragsId || parseInt(id, 10);
      const editionNumber = article?.edition?.number || null;
      console.log("🆔 Usando contentId:", contentIdToUse);
      // 🗑️ Eliminar imágenes no incluidas en keepImages
      if (Array.isArray(keepImages)) {
        console.log("🔍 keepImages recibido:", keepImages);

        // Obtener todas las imágenes actuales del artículo
        const currentImages = await prisma.image.findMany({
          where: {
            contentType: "ARTICLE",
            contentId: contentIdToUse,
          },
          select: { id: true },
        });

        console.log("📸 Imágenes actuales en BD:", currentImages);

        // 🔥 Convertir keepImages a números por si vienen como strings
        const keepIdsAsNumbers = keepImages.map((id) => parseInt(id, 10));
        console.log("🔢 keepImages convertidos a números:", keepIdsAsNumbers);

        // Imágenes a borrar = todas las actuales que NO están en keepImages
        const imagesToDelete = currentImages
          .filter((img) => !keepIdsAsNumbers.includes(img.id))
          .map((img) => img.id);

        console.log("🗑️ Imágenes a BORRAR:", imagesToDelete);

        if (imagesToDelete.length > 0) {
          await prisma.image.deleteMany({
            where: {
              id: { in: imagesToDelete },
            },
          });
          console.log("✅ Imágenes borradas exitosamente");
        } else {
          console.log("⚠️ No hay imágenes para borrar");
        }
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
          const { url } = await uploadFile(file, getImageSubfolder(editionNumber), `article_${id}`);

          await prisma.image.create({
            data: {
              contentType: "ARTICLE",
              contentId: contentIdToUse,
              url,
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
          const { url } = await uploadFile(file, getImageSubfolder(editionNumber), `article_${id}`);

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
              contentId: contentIdToUse,
              url,
              title: meta.title || null,
              alt: meta.alt || null,
            },
          });
        }
      }

      // 🖼️ Registrar imágenes inline nuevas
      try {
        const inlineRaw = formData.get("inlineImageUrls");
        if (inlineRaw) {
          const inlineUrls = JSON.parse(inlineRaw);
          for (const url of inlineUrls) {
            // Evitar duplicados si ya existe ese URL para este artículo
            const exists = await prisma.image.findFirst({
              where: { contentType: "ARTICLE_INLINE", contentId: contentIdToUse, url },
            });
            if (!exists) {
              await prisma.image.create({
                data: { contentType: "ARTICLE_INLINE", contentId: contentIdToUse, url },
              });
            }
          }
        }
      } catch (inlineErr) {
        console.error("❌ Error registrando imágenes inline:", inlineErr);
      }

      // 🗑️ Reconciliar imágenes inline: borrar las que ya no están en el contenido
      try {
        const savedInlineImages = await prisma.image.findMany({
          where: { contentType: "ARTICLE_INLINE", contentId: contentIdToUse },
        });

        if (savedInlineImages.length > 0) {
          // New URLs uploaded during this save session
          let newInlineUrls = [];
          try {
            const inlineRaw = formData.get("inlineImageUrls");
            if (inlineRaw) newInlineUrls = JSON.parse(inlineRaw);
          } catch (_) {}

          // Extraer URLs presentes en el HTML del content actual
          const activeUrls = new Set();
          const imgMatches = (content || "").matchAll(/<img[^>]+src="([^"]+)"/g);
          for (const match of imgMatches) activeUrls.add(match[1]);

          const orphanedImages = savedInlineImages.filter((img) => !activeUrls.has(img.url));

          if (orphanedImages.length > 0) {
            // Patch contentES: replace old URL with new one, or remove the <img> entirely
            const articleForES = await prisma.article.findUnique({
              where: { id: parseInt(id, 10) },
              select: { contentES: true },
            });
            let contentES = articleForES?.contentES || "";

            orphanedImages.forEach((orphan, i) => {
              if (!contentES.includes(orphan.url)) return;
              const newUrl = newInlineUrls[i] || null;
              if (newUrl) {
                // Replace the src in-place so the image still appears in the Spanish version
                contentES = contentES.replaceAll(`src="${orphan.url}"`, `src="${newUrl}"`);
              } else {
                // No replacement: remove the whole <p><img></p> block
                const escaped = orphan.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                contentES = contentES.replace(
                  new RegExp(`<p>\\s*<img[^>]+src="${escaped}"[^>]*>\\s*<\\/p>`, "g"),
                  ""
                );
              }
            });

            if (contentES !== (articleForES?.contentES || "")) {
              await prisma.article.update({
                where: { id: parseInt(id, 10) },
                data: { contentES },
              });
            }

            // Las que ya no aparecen en el contenido → borrar del disco y BD
            for (const img of orphanedImages) {
              await deleteFile(img.url);
              await prisma.image.delete({ where: { id: img.id } });
            }
          }
        }
      } catch (reconcileErr) {
        console.error("❌ Error en reconciliación de imágenes inline:", reconcileErr);
      }

      // 🧩 Construir el objeto de actualización sin tocar publicationDate por defecto
      const dataToUpdate = {
        title,
        subtitle,
        previewText: previewText || null,
        content,
        ...(contentES !== null && { contentES }),
        additionalInfo: additionalInfo || null,
        authors: {
          set: authors.map((id) => ({ id: parseInt(id, 10) })),
        },
        interviewees: {
          set: interviewees.map((id) => ({ id: parseInt(id, 10) })),
        },
        isInPrintEdition: isPrinted,
        editionId: editionId ? parseInt(editionId, 10) : null,
        startPage: startPage ? parseInt(startPage, 10) : null,
        endPage: endPage ? parseInt(endPage, 10) : null,
        beitragstypId: beitragstypId ? parseInt(beitragstypId, 10) : null,
        beitragssubtypId: beitragssubtypId
          ? parseInt(beitragssubtypId, 10)
          : null,
        mediaTitle: formData.get("mediaTitle") || null,
        categories: categories.length
          ? { set: categories.map((id) => ({ id: parseInt(id, 10) })) }
          : undefined,
        regions: { set: regions.map((id) => ({ id: parseInt(id, 10) })) },
        topics: { set: topics.map((id) => ({ id: parseInt(id, 10) })) },
        isPublished,
      };

      // ✅ Solo actualizar la fecha si el usuario activó “Editar fecha del artículo”
      const useCustomDate = formData.get("useCustomDate") === "true";
      if (useCustomDate && publicationDate) {
        dataToUpdate.publicationDate = publicationDate;
      }

      // ⚡ Prisma actualizará automáticamente updatedAt
      const updatedArticle = await prisma.article.update({
        where: { id: parseInt(id, 10) },
        data: dataToUpdate,
        include: {
          edition: {
            select: {
              id: true,
              number: true,
              title: true,
              datePublished: true,
            },
          },
        },
      });
      // 👇 Solo log si el user no es "eZe"
      if (session?.user?.name !== "eZe") {
        await prisma.activityLog.create({
          data: {
            userId,
            articleId: updatedArticle.id,
            action: "UPDATE_ARTICLE",
            metadata: JSON.stringify({
              title: updatedArticle.title,
              legacyPath: updatedArticle.legacyPath,
              edition: updatedArticle.edition
                ? {
                    id: updatedArticle.edition.id,
                    number: updatedArticle.edition.number,
                    title: updatedArticle.edition.title,
                    datePublished: updatedArticle.edition.datePublished,
                  }
                : null,
            }),
          },
        });
      }
      // 📄 Procesar PDFs: eliminar los marcados y subir los nuevos
      const removePdfIds = (() => {
        try {
          return JSON.parse(formData.get("removePdfIds") || "[]");
        } catch { return []; }
      })();
      if (removePdfIds.length > 0) {
        const pdfsToDelete = await prisma.articlePdf.findMany({
          where: { id: { in: removePdfIds.map((x) => parseInt(x, 10)) }, articleId: parseInt(id, 10) },
        });
        for (const pdf of pdfsToDelete) {
          await deleteFile(pdf.url);
        }
        await prisma.articlePdf.deleteMany({
          where: { id: { in: removePdfIds.map((x) => parseInt(x, 10)) }, articleId: parseInt(id, 10) },
        });
      }

      // Subir nuevos PDFs
      const pdfIndices = new Set();
      for (const key of formData.keys()) {
        const m = key.match(/^pdfs\[(\d+)\]\[(file|title)\]$/);
        if (m) pdfIndices.add(parseInt(m[1], 10));
      }
      for (const idx of Array.from(pdfIndices).sort((a, b) => a - b)) {
        const file = formData.get(`pdfs[${idx}][file]`);
        const title = formData.get(`pdfs[${idx}][title]`) || "";
        if (!file || !file.name) continue;
        const { url: pdfUrl } = await uploadFile(file, editionNumber ? `pdfs-public/editions/${editionNumber}` : "pdfs-public/online");
        await prisma.articlePdf.create({
          data: { articleId: parseInt(id, 10), url: pdfUrl, title },
        });
      }

      const images = await prisma.image.findMany({
        where: { contentType: "ARTICLE", contentId: contentIdToUse },
      });
      const pdfs = await prisma.articlePdf.findMany({
        where: { articleId: parseInt(id, 10) },
        orderBy: { createdAt: "asc" },
      });

      return Response.json(
        {
          ...updatedArticle,
          images,
          pdfs,
        },
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Tipo de contenido no soportado" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    Sentry.captureException(error);
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

    // 3️⃣ Eliminar imágenes del disco
    for (const image of images) {
      await deleteFile(image.url);
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
    Sentry.captureException(error);
    console.error("❌ Error en DELETE /api/articles/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

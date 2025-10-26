import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req, context) {
  try {
    const params = await context.params;
    const editionId = params?.id ? parseInt(params.id, 10) : null;

    if (!editionId || isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido o faltante" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Obtener el idioma del header
    const acceptLanguage = req.headers.get("accept-language") || "de";
    const locale = acceptLanguage.includes("es") ? "es" : "de";

    // Buscar la edición
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      select: {
        id: true,
        number: true,
        title: true,
        subtitle: true,
        summary: true,
        tableOfContents: true,
        coverImage: true,
        isAvailableToOrder: true,
        isCurrent: true,
        datePublished: true,
        // Campos en español
        titleES: true,
        subtitleES: true,
        summaryES: true,
        tableOfContentsES: true,
        isTranslatedES: true,
        regions: true,
        topics: true,
      },
    });

    if (!edition) {
      return new Response(JSON.stringify({ error: "Edición no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si el locale es español y hay traducción, mezclar los campos
    let responseData = { ...edition };

    if (locale === "es" && edition.isTranslatedES) {
      responseData = {
        ...edition,
        title: edition.titleES || edition.title,
        subtitle: edition.subtitleES || edition.subtitle,
        summary: edition.summaryES || edition.summary,
        tableOfContents: edition.tableOfContentsES || edition.tableOfContents,
      };
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en GET /api/editions/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// 📌 PUT (actualizar edición)
export async function PUT(req, context) {
  try {
    // ✅ FIX 1: Await params
    const params = await context.params;
    const editionId = params?.id ? parseInt(params.id, 10) : null;

    if (!editionId || isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ FIX 2: Detectar si viene JSON o FormData
    const contentType = req.headers.get("content-type") || "";
    let data = {};
    let coverImageFile = null;
    let removeCover = false;

    if (contentType.includes("application/json")) {
      // 🟦 Viene JSON (desde el componente de traducción)
      const jsonData = await req.json();

      data = {
        number: jsonData.number,
        title: jsonData.title,
        subtitle: jsonData.subtitle || null,
        datePublished: jsonData.datePublished,
        summary: jsonData.summary,
        tableOfContents: jsonData.tableOfContents || null,
        isCurrent: jsonData.isCurrent,
        isAvailableToOrder: jsonData.isAvailableToOrder,
        regions: jsonData.regions || [],
        topics: jsonData.topics || [],
        // 🆕 Traducciones ES
        titleES: jsonData.titleES,
        subtitleES: jsonData.subtitleES,
        summaryES: jsonData.summaryES,
        tableOfContentsES: jsonData.tableOfContentsES,
        isTranslatedES: jsonData.isTranslatedES,
        // 🆕 Estado de traducción y metadatos
        translationStatus: jsonData.translationStatus,
        needsReviewES: jsonData.needsReviewES,
        reviewedAt: jsonData.reviewedAt ? new Date(jsonData.reviewedAt) : null,
        assignedAt: jsonData.assignedAt ? new Date(jsonData.assignedAt) : null,
        translatorId: jsonData.translatorId || null,
      };
    } else {
      // 🟩 Viene FormData (desde formulario con archivos)
      const formData = await req.formData();

      data = {
        number: parseInt(formData.get("number"), 10),
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || null,
        datePublished: formData.get("datePublished"),
        summary: formData.get("summary"),
        tableOfContents: formData.get("tableOfContents") || null,
        isCurrent: formData.get("isCurrent") === "true",
        isAvailableToOrder: formData.get("isAvailableToOrder") === "true",
        regions: JSON.parse(formData.get("regions") || "[]"),
        topics: JSON.parse(formData.get("topics") || "[]"),
        // 🆕 Traducciones ES
        titleES: formData.get("titleES"),
        subtitleES: formData.get("subtitleES"),
        summaryES: formData.get("summaryES"),
        tableOfContentsES: formData.get("tableOfContentsES"),
        isTranslatedES: formData.get("isTranslatedES") === "true",
        // Estado de traducción y metadatos
        translationStatus: formData.get("translationStatus"),
        needsReviewES: formData.get("needsReviewES") === "true",
        reviewedAt: formData.get("reviewedAt")
          ? new Date(formData.get("reviewedAt"))
          : null,
        assignedAt: formData.get("assignedAt")
          ? new Date(formData.get("assignedAt"))
          : null,
        translatorId: formData.get("translatorId") || null,
      };

      removeCover = formData.get("removeCover") === "true";
      coverImageFile = formData.get("coverImage");
    }

    // 🖼️ Manejo de imagen de portada (solo si viene FormData con imagen)
    let coverImageUrl = null;

    if (removeCover) {
      // 🟥 Eliminar portada existente
      const existing = await prisma.edition.findUnique({
        where: { id: editionId },
        select: { coverImage: true },
      });

      if (existing?.coverImage) {
        try {
          const urlParts = existing.coverImage.split("/");
          const fileName = urlParts[urlParts.length - 1];
          const publicId = `ila/editions/${fileName.split(".")[0]}`;
          await cloudinary.v2.uploader.destroy(publicId);
        } catch (err) {
          console.error("⚠️ Error eliminando portada en Cloudinary:", err);
        }
      }

      coverImageUrl = null;
    } else if (coverImageFile && typeof coverImageFile !== "string") {
      // 🟦 Subir nueva portada
      const buffer = Buffer.from(await coverImageFile.arrayBuffer());
      const uploadResult = await cloudinary.v2.uploader.upload(
        `data:image/jpeg;base64,${buffer.toString("base64")}`,
        {
          folder: "ila/editions",
          public_id: `coverImage-${editionId}-${Date.now()}`,
          overwrite: true,
        }
      );
      coverImageUrl = uploadResult.secure_url;
    } else {
      // 🟩 Mantener la portada actual
      const existing = await prisma.edition.findUnique({
        where: { id: editionId },
        select: { coverImage: true },
      });
      coverImageUrl = existing?.coverImage || null;
    }

    // ✅ Construir objeto de actualización (solo campos que vienen)
    const updateData = {};

    if (data.number !== undefined && !isNaN(data.number))
      updateData.number = data.number;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.datePublished !== undefined) {
      updateData.datePublished = data.datePublished
        ? new Date(data.datePublished)
        : null;
    }
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.tableOfContents !== undefined)
      updateData.tableOfContents = data.tableOfContents;
    if (data.isCurrent !== undefined) updateData.isCurrent = data.isCurrent;
    if (data.isAvailableToOrder !== undefined)
      updateData.isAvailableToOrder = data.isAvailableToOrder;

    // 🆕 Traducciones ES
    if (data.titleES !== undefined) updateData.titleES = data.titleES;
    if (data.subtitleES !== undefined) updateData.subtitleES = data.subtitleES;
    if (data.summaryES !== undefined) updateData.summaryES = data.summaryES;
    if (data.tableOfContentsES !== undefined)
      updateData.tableOfContentsES = data.tableOfContentsES;
    if (data.isTranslatedES !== undefined)
      updateData.isTranslatedES = data.isTranslatedES;
    // 🧠 Nuevos campos de traducción y tracking
    if (data.translationStatus !== undefined)
      updateData.translationStatus = data.translationStatus;
    if (data.needsReviewES !== undefined)
      updateData.needsReviewES = data.needsReviewES;
    if (data.reviewedAt !== undefined) updateData.reviewedAt = data.reviewedAt;
    if (data.assignedAt !== undefined) updateData.assignedAt = data.assignedAt;
    if (data.translatorId !== undefined)
      updateData.translatorId = data.translatorId;
    // Solo actualizar coverImage si se procesó
    if (coverImageUrl !== null || removeCover) {
      updateData.coverImage = coverImageUrl;
    }

    // Actualizar relaciones si vienen
    if (data.regions && Array.isArray(data.regions)) {
      updateData.regions = { set: data.regions.map((id) => ({ id })) };
    }
    if (data.topics && Array.isArray(data.topics)) {
      updateData.topics = { set: data.topics.map((id) => ({ id })) };
    }

    // ✅ Antes de actualizar, obtener la edición existente
    const existing = await prisma.edition.findUnique({
      where: { id: editionId },
    });

    // 🧠 Mantener los campos originales si no se envían en la actualización
    // 🧠 Crear el objeto de actualización sin incluir campos no permitidos
    const safeUpdateData = {
      ...updateData,
      title: updateData.title ?? existing.title,
      subtitle: updateData.subtitle ?? existing.subtitle,
      summary: updateData.summary ?? existing.summary,
      tableOfContents: updateData.tableOfContents ?? existing.tableOfContents,
    };

    // 🧹 Eliminar campos que Prisma no permite actualizar
    delete safeUpdateData.id;
    delete safeUpdateData.createdAt;
    delete safeUpdateData.translator;
    delete safeUpdateData.activityLogs;

    // 🧠 Evitar errores de null en translationStatus
    if (!safeUpdateData.translationStatus) {
      safeUpdateData.translationStatus =
        existing.translationStatus || "not_assigned";
    }

    // ✅ Actualizar edición en DB sin perder el contenido original
    const updatedEdition = await prisma.edition.update({
      where: { id: editionId },
      data: safeUpdateData,
      include: { regions: true, topics: true },
    });
    // 🧠 Registrar actividad del traductor o admin revisor
    try {
      await prisma.activityLog.create({
        data: {
          userId: safeUpdateData.translatorId || null, // traductor actual
          editionId, // edición afectada
          action:
            safeUpdateData.translationStatus === "approved"
              ? "REVIEW_TRANSLATION"
              : "TRANSLATE_EDITION", // depende del estado
        },
      });
    } catch (err) {
      console.warn("⚠️ No se pudo registrar el log de actividad:", err);
    }

    return new Response(JSON.stringify(updatedEdition), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error en PUT /editions/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Error al actualizar edición",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// 📌 DELETE (eliminar edición)
export async function DELETE(req, context) {
  try {
    // ✅ FIX: Await params
    const params = await context.params;
    const editionId = params?.id ? parseInt(params.id, 10) : null;

    if (!editionId || isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 🗑️ Opcional: Eliminar imagen de Cloudinary antes de borrar
    const existing = await prisma.edition.findUnique({
      where: { id: editionId },
      select: { coverImage: true },
    });

    if (existing?.coverImage) {
      try {
        const urlParts = existing.coverImage.split("/");
        const fileName = urlParts[urlParts.length - 1];
        const publicId = `ila/editions/${fileName.split(".")[0]}`;
        await cloudinary.v2.uploader.destroy(publicId);
      } catch (err) {
        console.error("⚠️ Error eliminando imagen en Cloudinary:", err);
      }
    }

    await prisma.edition.delete({
      where: { id: editionId },
    });

    return new Response(
      JSON.stringify({ message: "Edición eliminada con éxito" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Error en DELETE /editions/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error al eliminar edición" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req, context) {
  try {
    // ✅ Usa `await` para obtener `params` correctamente
    const params = await context.params;
    const editionId = params?.id ? parseInt(params.id, 10) : null;

    if (!editionId || isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido o faltante" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ Buscar la edición en la base de datos
    const edition = await prisma.edition.findUnique({
      where: { id: editionId },
      include: {
        regions: true, // Incluye las regiones asociadas
        topics: true, // Incluye los temas asociados
      },
    });

    if (!edition) {
      return new Response(JSON.stringify({ error: "Edición no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(edition), {
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
// 📌 PUT (actualizar edición)
export async function PUT(req, { params }) {
  try {
    const editionId = parseInt(params.id, 10);
    if (isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    const formData = await req.formData();

    const number = parseInt(formData.get("number"), 10);
    const title = formData.get("title");
    const subtitle = formData.get("subtitle") || null;
    const datePublished = formData.get("datePublished");
    const summary = formData.get("summary");
    const tableOfContents = formData.get("tableOfContents") || null;
    const isCurrent = formData.get("isCurrent") === "true";
    const isAvailableToOrder = formData.get("isAvailableToOrder") === "true";

    const regions = JSON.parse(formData.get("regions") || "[]");
    const topics = JSON.parse(formData.get("topics") || "[]");

    const removeCover = formData.get("removeCover") === "true";
    const coverImageFile = formData.get("coverImage");

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

    // ✅ Actualizar edición en DB
    const updatedEdition = await prisma.edition.update({
      where: { id: editionId },
      data: {
        number,
        title,
        subtitle,
        datePublished: datePublished ? new Date(datePublished) : null,
        summary,
        tableOfContents,
        isCurrent,
        isAvailableToOrder,
        coverImage: coverImageUrl,
        regions: { set: regions.map((id) => ({ id })) },
        topics: { set: topics.map((id) => ({ id })) },
      },
      include: { regions: true, topics: true },
    });

    return new Response(JSON.stringify(updatedEdition), { status: 200 });
  } catch (error) {
    console.error("❌ Error en PUT /editions/[id]:", error);
    return new Response(
      JSON.stringify({
        error: "Error al actualizar edición",
        details: error.message,
      }),
      { status: 500 }
    );
  }
}
// 📌 DELETE (eliminar edición)
export async function DELETE(req, { params }) {
  try {
    const editionId = parseInt(params.id, 10);
    if (isNaN(editionId)) {
      return new Response(JSON.stringify({ error: "ID inválido" }), {
        status: 400,
      });
    }

    await prisma.edition.delete({
      where: { id: editionId },
    });

    return new Response(
      JSON.stringify({ message: "Edición eliminada con éxito" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error en DELETE /editions/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Error al eliminar edición" }),
      {
        status: 500,
      }
    );
  }
}

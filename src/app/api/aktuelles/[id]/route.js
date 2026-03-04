import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import cloudinary from "cloudinary";

// ⚙️ Config Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper para subir base64/dataURL a Cloudinary
async function uploadDataUrlToCloudinary(dataUrl) {
  const res = await cloudinary.v2.uploader.upload(dataUrl, {
    folder: "ila/aktuelles",
    resource_type: "image",
  });
  return res.secure_url;
}

export async function GET(_req, context) {
  try {
    const params = await context.params; // ✅ FIX: await params
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const aktuelles = await prisma.aktuelles.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!aktuelles) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // traer imágenes aparte
    const images = await prisma.image.findMany({
      where: {
        contentType: "NEWS",
        contentId: id,
      },
    });

    return NextResponse.json({ ...aktuelles, images });
  } catch (err) {
    console.error("GET /api/aktuelles/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/aktuelles/[id]
export async function PUT(req, context) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
    }

    const params = await context.params; // ✅ FIX: await params
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const {
      title,
      titleES,
      subtitle,
      subtitleES,
      content,
      contentES,
      link,
      date,
      images = [],
    } = await req.json();

    const data = {};
    if (typeof title === "string") data.title = title.trim();
    if (typeof titleES === "string") data.titleES = titleES.trim();
    if (typeof subtitle === "string") data.subtitle = subtitle.trim() || null;
    if (typeof subtitleES === "string") data.subtitleES = subtitleES.trim() || null;
    if (typeof content === "string") data.content = content.trim();
    if (typeof contentES === "string") data.contentES = contentES.trim();
    if (typeof link === "string") data.link = link.trim() || null;
    if (date) data.date = new Date(date);

    // 1) Actualizar datos básicos del Aktuelles
    await prisma.aktuelles.update({
      where: { id },
      data,
    });

    // 2) Obtener imágenes actuales
    const existingImages = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: id },
    });

    const existingIds = existingImages.map((img) => img.id);
    const incomingIds = (images || []).filter((i) => i.id).map((i) => i.id);

    // 3) Borrar las que no están en el array entrante
    const toDelete = existingIds.filter(
      (imgId) => !incomingIds.includes(imgId)
    );
    if (toDelete.length > 0) {
      await prisma.image.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    // 4) Procesar cada imagen entrante
    for (const img of images || []) {
      if (img.id && existingIds.includes(img.id)) {
        // Update existente - ✅ FIX: Solo actualizar campos que existen
        await prisma.image.update({
          where: { id: img.id },
          data: {
            title: img.title || null,
            alt: img.alt || null,
            // ❌ Removidos: isCover y order (no existen en el schema)
          },
        });
      } else if (img.fileDataUrl) {
        // Nueva imagen → subir a Cloudinary
        try {
          const url = await uploadDataUrlToCloudinary(img.fileDataUrl);
          await prisma.image.create({
            data: {
              contentType: "NEWS",
              contentId: id,
              url,
              title: img.title || null,
              alt: img.alt || null,
            },
          });
        } catch (err) {
          console.error("❌ Error subiendo imagen nueva:", err);
        }
      }
    }

    // 5) Devolver aktuelles actualizado con imágenes incluidas
    const aktu = await prisma.aktuelles.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Traer imágenes manualmente
    const imagesResult = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: id },
    });

    // Devolver combinado
    return NextResponse.json({ ...aktu, images: imagesResult });
  } catch (err) {
    console.error("PUT /api/aktuelles/[id] error:", err);
    if (String(err?.code) === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req, context) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
    }

    const params = await context.params; // ✅ FIX: await params
    const id = parseInt(params.id, 10);
    if (!id || Number.isNaN(id)) {
      console.error("❌ DELETE /api/aktuelles/[id] → ID inválido:", params.id);
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.aktuelles.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/aktuelles/[id] error:", err);
    if (String(err?.code) === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

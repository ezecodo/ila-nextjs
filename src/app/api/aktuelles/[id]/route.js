import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { uploadFile, deleteFile } from "@/lib/localUpload";

export async function GET(_req, context) {
  try {
    const params = await context.params;
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

    const images = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: id },
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

    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const formData = await req.formData();

    const data = {};
    const title = formData.get("title");
    const titleES = formData.get("titleES");
    const subtitle = formData.get("subtitle");
    const subtitleES = formData.get("subtitleES");
    const content = formData.get("content");
    const contentES = formData.get("contentES");

    if (typeof title === "string") data.title = title.trim();
    if (typeof titleES === "string") data.titleES = titleES.trim();
    if (typeof subtitle === "string") data.subtitle = subtitle.trim() || null;
    if (typeof subtitleES === "string") data.subtitleES = subtitleES.trim() || null;
    if (typeof content === "string") data.content = content.trim();
    if (typeof contentES === "string") data.contentES = contentES.trim();

    await prisma.aktuelles.update({ where: { id }, data });

    // Determinar qué imágenes existentes conservar
    const keepImageIds = JSON.parse(formData.get("keepImageIds") || "[]");

    // Borrar las imágenes no conservadas
    const existingImages = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: id },
    });

    const toDelete = existingImages.filter((img) => !keepImageIds.includes(img.id));
    for (const img of toDelete) {
      await deleteFile(img.url);
      await prisma.image.delete({ where: { id: img.id } });
    }

    // Actualizar metadatos de imágenes conservadas
    const imageIndices = new Set();
    for (const key of formData.keys()) {
      const m = key.match(/^images\[(\d+)\]\[(file|id|title|alt)\]$/);
      if (m) imageIndices.add(parseInt(m[1], 10));
    }

    for (const idx of Array.from(imageIndices).sort((a, b) => a - b)) {
      const existingId = formData.get(`images[${idx}][id]`);
      const file = formData.get(`images[${idx}][file]`);
      const imgTitle = formData.get(`images[${idx}][title]`) || null;
      const imgAlt = formData.get(`images[${idx}][alt]`) || null;

      if (existingId) {
        // Update metadata of existing image
        await prisma.image.update({
          where: { id: parseInt(existingId, 10) },
          data: { title: imgTitle, alt: imgAlt },
        });
      } else if (file && file.name) {
        // New image upload
        try {
          const { url } = await uploadFile(file, "images/aktuelles", `aktuelles_${id}`);
          await prisma.image.create({
            data: {
              contentType: "NEWS",
              contentId: id,
              url,
              title: imgTitle,
              alt: imgAlt,
            },
          });
        } catch (err) {
          console.error("❌ Error subiendo imagen nueva:", err);
        }
      }
    }

    const aktu = await prisma.aktuelles.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    const imagesResult = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: id },
    });

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

    const params = await context.params;
    const id = parseInt(params.id, 10);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Delete images from disk before deleting the record
    const images = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: id },
    });
    for (const img of images) {
      await deleteFile(img.url);
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

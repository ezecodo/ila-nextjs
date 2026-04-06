import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/localUpload";

// 📌 GET: listar todos los Aktuelles
export async function GET() {
  try {
    const aktuelles = await prisma.aktuelles.findMany({
      orderBy: { date: "desc" },
      include: { createdBy: true },
    });

    const ids = aktuelles.map((a) => a.id);
    const images = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: { in: ids } },
    });

    const aktuellesWithImages = aktuelles.map((a) => ({
      ...a,
      images: images.filter((img) => img.contentId === a.id),
    }));

    return NextResponse.json({ items: aktuellesWithImages });
  } catch (error) {
    console.error("❌ Error al obtener Aktuelles:", error);
    return NextResponse.json(
      { error: "Error al cargar Aktuelles" },
      { status: 500 }
    );
  }
}

// 📌 POST: crear nuevo Aktuelles
export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Nicht erlaubt" }, { status: 403 });
    }

    const formData = await req.formData();

    const title = formData.get("title");
    const titleES = formData.get("titleES");
    const subtitle = formData.get("subtitle") || null;
    const subtitleES = formData.get("subtitleES") || null;
    const content = formData.get("content");
    const contentES = formData.get("contentES");

    const aktu = await prisma.aktuelles.create({
      data: {
        title,
        titleES,
        subtitle,
        subtitleES,
        content,
        contentES,
        createdById: session.user.id,
      },
    });

    // Procesar imágenes: images[0][file], images[0][title], images[0][alt]
    const imageIndices = new Set();
    for (const key of formData.keys()) {
      const m = key.match(/^images\[(\d+)\]\[(file|title|alt)\]$/);
      if (m) imageIndices.add(parseInt(m[1], 10));
    }

    for (const idx of Array.from(imageIndices).sort((a, b) => a - b)) {
      const file = formData.get(`images[${idx}][file]`);
      if (!file || !file.name) continue;
      try {
        const { url } = await uploadFile(file, "images/aktuelles", `aktuelles_${aktu.id}`);
        await prisma.image.create({
          data: {
            contentType: "NEWS",
            contentId: aktu.id,
            url,
            title: formData.get(`images[${idx}][title]`) || null,
            alt: formData.get(`images[${idx}][alt]`) || null,
          },
        });
      } catch (e) {
        console.error(`❌ Error subiendo imagen idx=${idx}:`, e);
      }
    }

    const imagesResult = await prisma.image.findMany({
      where: { contentType: "NEWS", contentId: aktu.id },
    });

    return NextResponse.json({ ...aktu, images: imagesResult }, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear Aktuelles:", error);
    return NextResponse.json(
      { error: "Error al crear Aktuelles" },
      { status: 500 }
    );
  }
}

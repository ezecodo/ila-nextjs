import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
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

// 📌 GET: listar todos los Aktuelles (con paginación)
export async function GET() {
  try {
    // 1) Buscar Aktuelles
    const aktuelles = await prisma.aktuelles.findMany({
      orderBy: { date: "desc" },
      include: { createdBy: true },
    });

    // 2) Buscar imágenes relacionadas
    const ids = aktuelles.map((a) => a.id);
    const images = await prisma.image.findMany({
      where: {
        contentType: "NEWS",
        contentId: { in: ids },
      },
    });

    // 3) Añadir imágenes a cada item
    const aktuellesWithImages = aktuelles.map((a) => ({
      ...a,
      images: images.filter((img) => img.contentId === a.id),
    }));

    return NextResponse.json({
      items: aktuellesWithImages,
    });
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

    const {
      title,
      titleES,
      content,
      contentES,
      date,
      link,
      images = [],
    } = await req.json();

    const aktu = await prisma.aktuelles.create({
      data: {
        title,
        titleES,
        content,
        contentES,
        date: date ? new Date(date) : undefined,
        link,
        createdById: session.user.id,
      },
    });
    // 2) Procesar imágenes
    const createdImages = [];
    for (const img of images) {
      let finalUrl = img.url || null;

      if (!finalUrl && img.fileDataUrl) {
        try {
          finalUrl = await uploadDataUrlToCloudinary(img.fileDataUrl);
        } catch (e) {
          console.error("❌ Error subiendo a Cloudinary:", e);
          continue;
        }
      }
      if (!finalUrl) continue;

      try {
        const saved = await prisma.image.create({
          data: {
            contentType: "NEWS", // 👈 importante
            contentId: aktu.id,
            url: finalUrl,
            title: img.title || null, // alt-text
            alt: img.alt || null, // créditos / desc
            isCover: !!img.isCover,
            order: typeof img.order === "number" ? img.order : 0,
          },
        });
        createdImages.push(saved);
      } catch (e) {
        console.error("❌ Error guardando imagen en DB:", e);
      }
    }

    // 3) Devolver aktuelles + imágenes
    const aktuWithImages = await prisma.aktuelles.findUnique({
      where: { id: aktu.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        images: true,
      },
    });

    return NextResponse.json(aktuWithImages, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear Aktuelles:", error);
    return NextResponse.json(
      { error: "Error al crear Aktuelles" },
      { status: 500 }
    );
  }
}

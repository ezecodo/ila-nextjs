import { NextResponse } from "next/server";
import cloudinary from "cloudinary";

import { prisma } from "@/lib/prisma"; // ✅ Usa la instancia compartida

// Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const editions = await prisma.edition.findMany({
      include: {
        regions: {
          select: {
            id: true,
            name: true,
            nameES: true, // ✅ incluimos el campo traducido
          },
        },
        topics: {
          select: {
            id: true,
            name: true,
            nameES: true, // ✅ incluimos el campo traducido
          },
        },
      },
    });

    return new Response(JSON.stringify(editions), { status: 200 });
  } catch (error) {
    console.error("Error fetching editions:", error);
    return new Response(JSON.stringify({ error: "Error fetching editions" }), {
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const number = parseInt(formData.get("number"), 10);
    const title = formData.get("title");
    const isAvailableToOrder = formData.get("isAvailableToOrder") === "true";
    const subtitle = formData.get("subtitle") || null;
    const datePublished = formData.get("datePublished");
    const summary = formData.get("summary");
    const tableOfContents = formData.get("tableOfContents") || null;
    const isCurrent = formData.get("isCurrent") === "true";

    const regions = JSON.parse(formData.get("regions") || "[]");
    const topics = JSON.parse(formData.get("topics") || "[]");

    const coverImageFile = formData.get("coverImage");

    // Validaciones básicas
    if (!number || !title || !summary) {
      console.error("Campos obligatorios faltantes:", {
        number,
        title,
        summary,
      });
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    console.log("Datos recibidos:", {
      number,
      title,
      subtitle,
      datePublished,
      summary,
      tableOfContents,
      isCurrent,
      regions,
      topics,
    });

    // Función para subir imágenes a Cloudinary
    const uploadImageToCloudinary = async (file, fieldName) => {
      if (!file) return null;

      const buffer = Buffer.from(await file.arrayBuffer());

      const uploadResult = await cloudinary.v2.uploader.upload(
        `data:image/jpeg;base64,${buffer.toString("base64")}`,
        {
          folder: "ila/editions", // Carpeta en Cloudinary
          public_id: `${fieldName}-${Date.now()}`,
          overwrite: true,
        }
      );

      return uploadResult.secure_url; // Retorna la URL de Cloudinary
    };

    // Subir imágenes a Cloudinary
    const coverImagePath = await uploadImageToCloudinary(
      coverImageFile,
      "coverImage"
    );

    console.log("URLs de imágenes en Cloudinary:", {
      coverImagePath,
    });

    // Crear nueva edición en la base de datos
    const newEdition = await prisma.edition.create({
      data: {
        number,
        title,
        subtitle,
        datePublished: new Date(datePublished),
        summary,
        tableOfContents,
        isCurrent,
        coverImage: coverImagePath, // Guardar URL de Cloudinary
        isAvailableToOrder,
        regions: regions.length
          ? { connect: regions.map((id) => ({ id })) }
          : undefined,
        topics: topics.length
          ? { connect: topics.map((id) => ({ id })) }
          : undefined,
      },
      include: { regions: true, topics: true },
    });

    console.log("Edición creada exitosamente:", newEdition);

    return NextResponse.json(newEdition, { status: 201 });
  } catch (error) {
    console.error("Error al crear la edición:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}

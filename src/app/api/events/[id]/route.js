"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "cloudinary";

// ⚙️ Config Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req, { params }) {
  try {
    const { id } = await params; // ✅ Ahora el ID se trata como un String

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id }, // ✅ Buscamos por ID como String
    });

    if (!event) {
      return NextResponse.json(
        { error: "Evento no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("🔥 Error interno en la API de eventos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// 📌 PUT: actualizar evento
// 📌 PUT: actualizar evento
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const data = await req.json();
    const {
      title,
      titleES,
      description,
      descriptionES,
      date,
      time,
      location,
      images = [],
    } = data;

    // 🔹 Datos base
    let updatedData = {
      title,
      titleES,
      description,
      descriptionES,
      date: new Date(date),
      time,
      location,
    };

    // 🔹 Procesar imágenes
    let firstImageUrl = null;

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
      if (!firstImageUrl) firstImageUrl = finalUrl;
    }

    // 🔹 Actualizar imagen según lo que venga del form
    if (images.length === 0) {
      updatedData.image = null; // 👉 eliminaste todas
    } else if (firstImageUrl) {
      updatedData.image = firstImageUrl; // 👉 nueva o existente
    }

    // 🔹 Actualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("❌ Error al actualizar evento:", error);
    return NextResponse.json(
      { error: "Error al actualizar evento" },
      { status: 500 }
    );
  }
}

// 👇 Helper que faltaba
async function uploadDataUrlToCloudinary(dataUrl) {
  const res = await cloudinary.v2.uploader.upload(dataUrl, {
    folder: "ila/events",
    resource_type: "image",
  });
  return res.secure_url;
}
export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Evento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return NextResponse.json(
      { error: "Error al eliminar evento" },
      { status: 500 }
    );
  }
}

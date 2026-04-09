"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/localUpload";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
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
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const data = await req.json();
    const { title, titleES, description, descriptionES, date, time, location, images = [] } = data;

    let updatedData = { title, titleES, description, descriptionES, date: new Date(date), time, location };

    let firstImageUrl = null;

    for (const img of images) {
      let finalUrl = img.url || null;

      if (!finalUrl && img.fileDataUrl) {
        try {
          // Convertir data URL a File-like object
          const matches = img.fileDataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) continue;
          const mimeType = matches[1];
          const buffer   = Buffer.from(matches[2], "base64");
          const ext      = mimeType.split("/")[1] || "jpg";
          const blob     = new Blob([buffer], { type: mimeType });
          const file     = new File([blob], `event_${id}_${Date.now()}.${ext}`, { type: mimeType });
          const { url }  = await uploadFile(file, "images/events");
          finalUrl = url;
        } catch (e) {
          console.error("❌ Error subiendo imagen:", e);
          continue;
        }
      }

      if (!finalUrl) continue;
      if (!firstImageUrl) firstImageUrl = finalUrl;
    }

    if (images.length === 0) {
      updatedData.image = null;
    } else if (firstImageUrl) {
      updatedData.image = firstImageUrl;
    }

    const updatedEvent = await prisma.event.update({ where: { id }, data: updatedData });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("❌ Error al actualizar evento:", error);
    return NextResponse.json(
      { error: "Error al actualizar evento" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ message: "Evento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return NextResponse.json(
      { error: "Error al eliminar evento" },
      { status: 500 }
    );
  }
}

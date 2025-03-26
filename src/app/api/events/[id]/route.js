"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params; // ✅ Ahora el ID se trata como un String

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

export async function PUT(req, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const date = formData.get("date");
    const location = formData.get("location");
    const file = formData.get("image"); // Puede ser null si no se cambia

    let updatedData = {
      title,
      description,
      date: new Date(date),
      location,
    };

    if (file && typeof file === "object") {
      // Subir nueva imagen si se seleccionó otra
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.v2.uploader
          .upload_stream({ folder: "ila-events" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      if (!uploadResponse.secure_url) {
        return NextResponse.json(
          { error: "Error al subir imagen" },
          { status: 500 }
        );
      }

      updatedData.image = uploadResponse.secure_url;
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updatedData,
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error al actualizar evento:", error);
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

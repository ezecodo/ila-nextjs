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

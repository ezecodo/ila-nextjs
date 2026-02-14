import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const registros = await prisma.annualIndex.findMany({
      orderBy: {
        year: "desc", // Más reciente primero
      },
    });

    return NextResponse.json(registros);
  } catch (error) {
    console.error("❌ Error obteniendo registros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

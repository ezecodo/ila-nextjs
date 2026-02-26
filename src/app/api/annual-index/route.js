import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const registros = await prisma.annualIndex.findMany({
      orderBy: { year: "desc" },
    });

    // Para cada registro, buscar el rango de números de dossier de ese año
    const registrosConRango = await Promise.all(
      registros.map(async (registro) => {
        const editions = await prisma.edition.findMany({
          where: {
            datePublished: {
              gte: new Date(`${registro.year}-01-01`),
              lte: new Date(`${registro.year}-12-31`),
            },
          },
          select: { number: true },
          orderBy: { number: "asc" },
        });

        const numbers = editions.map((e) => e.number).filter(Boolean);

        const dossiersRange =
          numbers.length === 0
            ? null
            : numbers.length === 1
              ? `ila ${numbers[0]}`
              : `ila ${numbers[0]} – ${numbers[numbers.length - 1]}`;

        return {
          ...registro,
          dossiersRange,
          dossiersCount: numbers.length,
        };
      }),
    );

    return NextResponse.json(registrosConRango);
  } catch (error) {
    console.error("❌ Error obteniendo registros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

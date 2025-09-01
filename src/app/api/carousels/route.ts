import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔹 Crear un carrusel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      titleES,
      titleDE,
      beitragstypId,
      limit,
      orderBy,
      regionId,
      categoryIds,
    } = body;

    const carousel = await prisma.carousel.create({
      data: {
        titleES: titleES || null,
        titleDE: titleDE || null,
        beitragstypId: beitragstypId ? Number(beitragstypId) : null,
        limit: limit || 10,
        orderBy: orderBy || "date_desc",
        regionId: regionId ? Number(regionId) : null,
        categories: categoryIds
          ? {
              connect: categoryIds.map((id: number) => ({ id })),
            }
          : undefined,
      },
      include: {
        categories: { select: { id: true, name: true, nameES: true } },
        beitragstyp: { select: { id: true, name: true, nameES: true } },
        region: { select: { id: true, name: true, nameES: true } },
      },
    });

    return NextResponse.json(carousel, { status: 201 });
  } catch (error) {
    console.error("❌ Error creando carrusel:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// 🔹 Listar todos los carruseles
export async function GET() {
  try {
    const carousels = await prisma.carousel.findMany({
      orderBy: { position: "asc" },
      select: {
        id: true,
        titleES: true,
        titleDE: true,
        limit: true,
        position: true,
        beitragstypId: true,
        regionId: true,
        region: { select: { id: true, name: true, nameES: true } },
        beitragstyp: { select: { id: true, name: true, nameES: true } },
        categories: { select: { id: true, name: true, nameES: true } },
      },
    });

    return NextResponse.json(carousels, { status: 200 });
  } catch (error) {
    console.error("❌ Error obteniendo carruseles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

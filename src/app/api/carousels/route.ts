import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // asegúrate de tener esto configurado

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, title, titleES, titleDE, beitragstypId, limit, orderBy } =
      body;

    if (!name || !title || !titleES || !titleDE || !beitragstypId) {
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    const carousel = await prisma.carousel.create({
      data: {
        name,
        title,
        titleES,
        titleDE,
        beitragstypId: parseInt(beitragstypId, 10),
        limit: limit || 10,
        orderBy: orderBy || "desc",
      },
    });

    return NextResponse.json(carousel, { status: 201 });
  } catch (error) {
    console.error("Error creando carrusel:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const carousels = await prisma.carousel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        beitragstyp: true,
      },
    });

    return NextResponse.json(carousels, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo carruseles:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

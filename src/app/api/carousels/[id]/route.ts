import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //

// GET /api/carousels/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const carousel = await prisma.carousel.findUnique({
      where: { id: params.id },
      include: {
        beitragstyp: true,
      },
    });

    if (!carousel) {
      return NextResponse.json(
        { error: "Carrusel no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(carousel);
  } catch (error) {
    console.error("Error obteniendo carrusel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// PUT /api/carousels/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, titleES, titleDE, beitragstypId, limit, orderBy } = body;

    const updated = await prisma.carousel.update({
      where: { id: params.id },
      data: {
        name,
        titleES,
        titleDE,
        beitragstypId,
        limit,
        orderBy,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error actualizando carrusel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE /api/carousels/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.carousel.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Carrusel eliminado" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error eliminando carrusel:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

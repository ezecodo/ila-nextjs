import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    const carousel = await prisma.carousel.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        title: true,
        titleES: true,
        titleDE: true,
        beitragstypId: true,
        regionId: true,
        limit: true,
        createdAt: true,
        updatedAt: true,
        beitragstyp: true,
      },
    });

    if (!carousel) {
      return NextResponse.json(
        { error: "Carrusel no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...carousel,
      regionId: carousel.regionId ?? null, // 👈 pasa explícitamente el regionId al frontend
    });
  } catch (error) {
    console.error("Error obteniendo carrusel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
// PUT /api/carousels/[id]
export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      name,
      titleES,
      titleDE,
      beitragstypId,
      limit,
      orderBy,
      regionId,
      position,
    } = body;

    const updated = await prisma.carousel.update({
      where: { id },
      data: {
        name,
        titleES,
        titleDE,
        beitragstypId,
        limit,
        orderBy,
        regionId: regionId || null, // 👈 necesario para que se guarde correctamente
        position,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error actualizando carrusel:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE /api/carousels/[id]

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop(); // Extraer ID desde URL

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    await prisma.carousel.delete({ where: { id } });

    return NextResponse.json(
      { message: "Carrusel eliminado" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error eliminando carrusel:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}

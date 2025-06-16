import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //

// GET /api/carousels/[id]
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop(); // extrae el ID de la URL

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    const carousel = await prisma.carousel.findUnique({
      where: { id },
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
export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, titleES, titleDE, beitragstypId, limit, orderBy } = body;

    const updated = await prisma.carousel.update({
      where: { id },
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
  request: Request,
  context: { params: { id: string } }
): Promise<Response> {
  const { id } = context.params;

  try {
    await prisma.carousel.delete({
      where: { id },
    });

    return new Response(JSON.stringify({ message: "Carrusel eliminado" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error eliminando carrusel:", error);
    return new Response(JSON.stringify({ error: "Error al eliminar" }), {
      status: 500,
    });
  }
}

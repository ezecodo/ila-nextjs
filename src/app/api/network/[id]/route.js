// app/api/network/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Actualizar organización
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const partner = await prisma.networkPartner.update({
      where: { id },
      data: {
        name: body.name,
        nameEs: body.nameEs || null,
        description: body.description || null,
        descriptionEs: body.descriptionEs || null,
        url: body.url,
        logoUrl: body.logoUrl || null,
        logoWidth: body.logoWidth || null,
        logoHeight: body.logoHeight || null,
        order: body.order || 0,
        active: body.active !== undefined ? body.active : true,
      },
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error updating network partner:", error);
    return NextResponse.json(
      { error: "Error al actualizar la organización" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar organización
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    await prisma.networkPartner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting network partner:", error);
    return NextResponse.json(
      { error: "Error al eliminar la organización" },
      { status: 500 }
    );
  }
}

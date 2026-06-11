import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request, context) {
  try {
    const params = await context?.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      titleES,
      url,
      icon,
      category,
      isActive,
      isFeatured,
      startDate,
      endDate,
      order,
      linkType,
      editionNumber,
      editionCoverImage,
    } = body;

    const updated = await prisma.link.update({
      where: { id },
      data: {
        title,
        titleES: titleES || null,
        url,
        icon: icon || null,
        category: category || null,
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        order: order ?? undefined,
        linkType: linkType ?? undefined,
        editionNumber: editionNumber === undefined ? undefined : editionNumber,
        editionCoverImage:
          editionCoverImage === undefined ? undefined : editionCoverImage,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error actualizando link:", error);
    return NextResponse.json(
      { error: "Error al actualizar link" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const params = await context?.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    await prisma.link.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando link:", error);
    return NextResponse.json(
      { error: "Error al eliminar link" },
      { status: 500 }
    );
  }
}

// app/api/banners/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Actualizar banner
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title: body.title || "",
        titleEs: body.titleEs || null,
        subtitle: body.subtitle || "",
        subtitleEs: body.subtitleEs || null,
        description: body.description || "",
        descriptionEs: body.descriptionEs || null,
        buttonText: body.buttonText || "",
        buttonTextEs: body.buttonTextEs || null,
        buttonUrl: body.buttonUrl || "",
        imageUrl: body.imageUrl || null,
        bgGradientFrom: body.bgGradientFrom || "#dc2626",
        bgGradientTo: body.bgGradientTo || "#b91c1c",
        titleSize: body.titleSize || "sm",
        subtitleSize: body.subtitleSize || "3xl",
        descriptionSize: body.descriptionSize || "base",
        buttonColor: body.buttonColor || "#dc2626",
        hasPromoForm:
          body.hasPromoForm !== undefined ? body.hasPromoForm : false,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive !== undefined ? body.isActive : true,
        position: body.position || "top",
        type: body.type || "cta",
        order: body.order !== undefined ? parseInt(body.order, 10) || 0 : 0,
        // { align, items } (o, por compatibilidad, un array plano de bloques)
        blocks: body.blocks && typeof body.blocks === "object" ? body.blocks : null,
      },
    });

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Error al actualizar el banner" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar banner
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Error al eliminar el banner" },
      { status: 500 }
    );
  }
}

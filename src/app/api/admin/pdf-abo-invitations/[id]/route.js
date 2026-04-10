import { NextResponse } from "next/server";

import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Eliminar invitación
export async function DELETE(request, { params }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    await prisma.pdfAboInvitation.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Invitación eliminada" });
  } catch (error) {
    console.error("Error al eliminar invitación:", error);
    return NextResponse.json(
      { message: "Error al eliminar invitación" },
      { status: 500 },
    );
  }
}

// GET - Obtener invitación individual
export async function GET(request, { params }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const invitation = await prisma.pdfAboInvitation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitación no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error al obtener invitación:", error);
    return NextResponse.json(
      { message: "Error al obtener invitación" },
      { status: 500 },
    );
  }
}

// PATCH - Actualizar invitación
export async function PATCH(request, { params }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const invitation = await prisma.pdfAboInvitation.update({
      where: { id },
      data: {
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
      },
    });

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error al actualizar invitación:", error);
    return NextResponse.json(
      { message: "Error al actualizar invitación" },
      { status: 500 },
    );
  }
}

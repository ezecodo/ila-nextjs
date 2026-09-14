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

    // Cambio de email: además de PdfAboInvitation.email, si la invitación ya
    // fue canjeada hay que actualizar también el User.email vinculado
    // (redeemedBy) — es el campo contra el que autentica NextAuth Credentials,
    // así que sin esto la persona no podría loguearse con su nueva dirección.
    if (data.email !== undefined) {
      const newEmail = data.email.trim().toLowerCase();

      if (!newEmail) {
        return NextResponse.json(
          { message: "El email no puede estar vacío" },
          { status: 400 },
        );
      }

      const current = await prisma.pdfAboInvitation.findUnique({
        where: { id },
        select: { email: true, redeemedBy: true, name: true },
      });

      if (!current) {
        return NextResponse.json(
          { message: "Invitación no encontrada" },
          { status: 404 },
        );
      }

      if (newEmail === current.email.toLowerCase()) {
        return NextResponse.json(current);
      }

      const [duplicateInvitation, duplicateUser] = await Promise.all([
        prisma.pdfAboInvitation.findUnique({ where: { email: newEmail } }),
        prisma.user.findUnique({ where: { email: newEmail } }),
      ]);

      if (duplicateInvitation) {
        return NextResponse.json(
          { message: "Ese email ya está en uso por otra invitación" },
          { status: 409 },
        );
      }
      if (duplicateUser && duplicateUser.id !== current.redeemedBy) {
        return NextResponse.json(
          { message: "Ese email ya está en uso por otra cuenta" },
          { status: 409 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedInvitation = await tx.pdfAboInvitation.update({
          where: { id },
          data: { email: newEmail },
        });
        if (current.redeemedBy) {
          await tx.user.update({
            where: { id: current.redeemedBy },
            data: { email: newEmail },
          });
        }
        return updatedInvitation;
      });

      // El envío del mail de invitación NO es automático acá: si la
      // invitación seguía Pendiente, el frontend le pregunta al admin si
      // quiere reenviarla (y, de confirmar, llama aparte al endpoint
      // existente POST .../[id]/resend) — ver handleSaveEmail en page.jsx.
      return NextResponse.json(updated);
    }

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
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Ese email ya está en uso" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Error al actualizar invitación" },
      { status: 500 },
    );
  }
}

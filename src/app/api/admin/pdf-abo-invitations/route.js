import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar todas las invitaciones
export async function GET(request) {
  try {
    const session = await auth();

    // Verificar que es admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const invitations = await prisma.pdfAboInvitation.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error al obtener invitaciones:", error);
    return NextResponse.json(
      { message: "Error al obtener invitaciones" },
      { status: 500 },
    );
  }
}

// POST - Crear nueva invitación
export async function POST(request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { email, startDate, endDate } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "El email es requerido" },
        { status: 400 },
      );
    }

    // Verificar si ya existe
    const existing = await prisma.pdfAboInvitation.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Este email ya tiene una invitación" },
        { status: 400 },
      );
    }

    const invitation = await prisma.pdfAboInvitation.create({
      data: {
        email: email.toLowerCase(),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error("Error al crear invitación:", error);
    return NextResponse.json(
      { message: "Error al crear invitación" },
      { status: 500 },
    );
  }
}

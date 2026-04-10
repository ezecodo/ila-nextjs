import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { sendPdfAboInvitationEmail } from "@/lib/email";

// POST - Reenviar email de invitación
export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { id } = params;

    const invitation = await prisma.pdfAboInvitation.findUnique({
      where: { id },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: "Invitación no encontrada" },
        { status: 404 },
      );
    }

    if (invitation.isRedeemed) {
      return NextResponse.json(
        { message: "Esta invitación ya fue activada" },
        { status: 400 },
      );
    }

    // Enviar email
    await sendPdfAboInvitationEmail(invitation.email, invitation.name || "");

    return NextResponse.json({
      message: "Email enviado",
      email: invitation.email,
    });
  } catch (error) {
    console.error("Error al reenviar invitación:", error);
    return NextResponse.json(
      { message: "Error al reenviar invitación" },
      { status: 500 },
    );
  }
}

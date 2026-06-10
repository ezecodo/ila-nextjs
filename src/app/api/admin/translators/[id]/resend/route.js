import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendTranslatorInvitationEmail } from "@/lib/email";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// Reenviar la invitación para definir contraseña (solo si la cuenta sigue pendiente).
export async function POST(req, context) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const params = await context?.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { message: "Se requiere el ID del usuario" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }
    if (user.emailVerified) {
      return NextResponse.json(
        { message: "La cuenta ya está activada; no hace falta reenviar." },
        { status: 409 }
      );
    }

    const email = user.email.toLowerCase();
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    await sendTranslatorInvitationEmail(email, user.name || "", token);

    return NextResponse.json({ resent: true });
  } catch (err) {
    console.error("POST /api/admin/translators/[id]/resend error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

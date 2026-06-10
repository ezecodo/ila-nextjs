import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hora (igual que /auth/forgot-password)

// Enviar email de restablecimiento de contraseña a un traductor activo.
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
    if (!user || !user.email) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const email = user.email.toLowerCase();
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error(
      "POST /api/admin/translators/[id]/reset-password error:",
      err
    );
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

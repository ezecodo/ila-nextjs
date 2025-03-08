import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendAdminInvitationEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import authConfig from "@/auth.config";

export async function POST(req) {
  try {
    const session = await getServerSession(authConfig);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Correo electrónico requerido." },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya está registrado." },
        { status: 400 }
      );
    }

    // Generar token único de invitación
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira en 24h

    // Guardar el token en la base de datos
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: expiresAt,
      },
    });

    // Enviar correo con el enlace de invitación
    await sendAdminInvitationEmail(email, token);

    return NextResponse.json(
      { message: "Invitación enviada con éxito." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al generar la invitación:", error);
    return NextResponse.json(
      { error: "Error al generar la invitación." },
      { status: 500 }
    );
  }
}

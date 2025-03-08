import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "El correo electrónico es requerido." },
        { status: 400 }
      );
    }

    // 🔎 Verificar si el usuario existe en la base de datos
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        {
          message:
            "✅ Si el correo está registrado, recibirás un enlace de recuperación.",
        },
        { status: 200 }
      );
    }

    // 🔥 Generar un token único y fecha de expiración
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000); // Expira en 1 hora

    // ✅ Guardar el token en la base de datos
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: expiresAt,
      },
    });

    // ✉️ Enviar email con el enlace de recuperación
    await sendPasswordResetEmail(email, resetToken);

    return NextResponse.json(
      {
        message:
          "✅ Si el correo está registrado, recibirás un enlace de recuperación.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error en la recuperación de contraseña:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 500 }
    );
  }
}

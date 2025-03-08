import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { signUpSchema } from "@/lib/zod";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name } = signUpSchema.parse(body);

    // ✅ Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    // ✅ Hashear la contraseña antes de guardarla
    const hashedPassword = await hash(password, 10);

    // ✅ Crear usuario (pero no verificado aún)
    await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    // ✅ Generar un token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira en 24h

    // ✅ Guardar el token en `VerificationToken`
    await prisma.verificationToken.create({
      data: {
        identifier: email, // Relacionamos el token con el email
        token: verificationToken,
        expires: expiresAt,
      },
    });

    // ✅ Enviar email con el token de verificación
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: "Registro exitoso. Verifica tu email para activar tu cuenta.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Error en el registro:", err);
    return NextResponse.json(
      { error: "Error en el registro" },
      { status: 500 }
    );
  }
}

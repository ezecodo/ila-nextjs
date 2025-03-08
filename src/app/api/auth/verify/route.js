import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token inválido o faltante." },
        { status: 400 }
      );
    }

    // 🔎 Buscar el token en `VerificationToken`
    const verificationEntry = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!verificationEntry) {
      return NextResponse.json(
        { error: "Token no encontrado o ya usado." },
        { status: 400 }
      );
    }

    if (verificationEntry.expires < new Date()) {
      return NextResponse.json(
        { error: "El token ha expirado." },
        { status: 400 }
      );
    }

    // ✅ Marcar usuario como verificado
    await prisma.user.update({
      where: { email: verificationEntry.identifier }, // `identifier` es el email
      data: { emailVerified: new Date() },
    });

    // 🔥 Eliminar el token con la clave compuesta
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationEntry.identifier,
          token: verificationEntry.token,
        },
      },
    });

    return NextResponse.json(
      { message: "Correo verificado exitosamente." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al verificar la cuenta:", error);
    return NextResponse.json(
      { error: "Error al verificar la cuenta." },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    // 🔍 Buscar el token en la base de datos
    const storedToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      );
    }

    // ✅ Marcar al usuario como verificado
    await prisma.user.update({
      where: { email: storedToken.identifier },
      data: { emailVerified: new Date() },
    });

    // 🚮 Eliminar el token usado
    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json(
      { message: "Cuenta verificada con éxito" },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error verificando email:", err);
    return NextResponse.json(
      { error: "Error verificando el email" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token o contraseña faltante." },
        { status: 400 }
      );
    }

    // 🔎 Buscar el token en la base de datos usando `findFirst()` para evitar errores de clave compuesta
    const verificationEntry = await prisma.verificationToken.findFirst({
      where: { token },
    });

    if (!verificationEntry || verificationEntry.expires < new Date()) {
      return NextResponse.json(
        { error: "Token inválido o expirado." },
        { status: 400 }
      );
    }

    // ✅ Extraemos el email del usuario desde `identifier`
    const email = verificationEntry.identifier;

    // 🔥 Hashear la nueva contraseña
    const hashedPassword = await hash(password, 10);

    // ✅ Actualizar la contraseña del usuario
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Definir la contraseña vía el link enviado por email verifica el correo si
    // aún no lo estaba (caso invitación de traductores: la cuenta se crea sin
    // verificar). Para cuentas ya verificadas no cambia nada.
    await prisma.user.updateMany({
      where: { email, emailVerified: null },
      data: { emailVerified: new Date() },
    });

    // 🗑️ Eliminar el token de recuperación usando `findFirst()` y eliminándolo con `deleteMany()`
    await prisma.verificationToken.deleteMany({
      where: { token },
    });

    return NextResponse.json(
      { message: "Contraseña restablecida con éxito." },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al restablecer la contraseña:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 500 }
    );
  }
}

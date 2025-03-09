import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { verifyPassword, hashPassword } from "@/lib/password"; // ✅ Agregado

export async function POST(req) {
  try {
    // ✅ Obtiene la sesión del usuario autenticado
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await req.json();

    // ✅ Si está cambiando solo el nombre
    if (name) {
      await prisma.user.update({
        where: { email: session.user.email },
        data: { name },
      });
      return NextResponse.json({
        message: "Nombre actualizado correctamente.",
      });
    }

    // ✅ Si está cambiando la contraseña
    if (currentPassword && newPassword) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado." },
          { status: 404 }
        );
      }

      // 🔐 Verifica la contraseña actual
      const passwordMatch = await verifyPassword(
        currentPassword,
        user.password
      );
      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Contraseña actual incorrecta." },
          { status: 400 }
        );
      }

      // 🔐 Hashea la nueva contraseña y actualiza
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { email: session.user.email },
        data: { password: hashedPassword },
      });

      return NextResponse.json({
        message: "Contraseña actualizada correctamente.",
      });
    }

    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error);
    return NextResponse.json(
      { error: "Error al actualizar el perfil." },
      { status: 500 }
    );
  }
}

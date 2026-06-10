import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";

// Habilitar / deshabilitar a un admin como traductor (canTranslate).
// No cambia el rol: sigue siendo admin, solo se suma (o se quita) de la lista
// de asignables para traducir.
export async function PATCH(req, context) {
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

    const body = await req.json();
    if (typeof body.canTranslate !== "boolean") {
      return NextResponse.json(
        { message: "Se requiere canTranslate (boolean)" },
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
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          message:
            "canTranslate solo aplica a admins. Para traductores reales usá el alta/quita del equipo.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { canTranslate: body.canTranslate },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("PATCH /api/admin/translators/[id] error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

// Quitar del equipo de traducción: el usuario pasa a rol `user`.
// No se borra la cuenta, así el nombre sigue figurando como traductor
// en los artículos que ya tradujo (article.translator.name).
export async function DELETE(req, context) {
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
    if (user.role !== "translator") {
      return NextResponse.json(
        { message: "El usuario no es traductor/a." },
        { status: 409 }
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: "user" },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("DELETE /api/admin/translators/[id] error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

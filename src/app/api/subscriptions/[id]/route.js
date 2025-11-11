import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 🔹 Obtener una suscripción por ID

export async function GET(request, context) {
  try {
    const params = await context.params; // ✅ se espera primero
    const { id } = params; // luego se usa con seguridad

    if (!id) {
      return NextResponse.json({ error: "ID faltante" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        gift: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("❌ Error en GET /api/subscriptions/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
export async function PATCH(req, { params }) {
  try {
    const { id } = params;

    const updated = await prisma.subscription.update({
      where: { id: String(id) },
      data: { isNew: false },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("❌ Error marcando suscripción como procesada:", error);
    return NextResponse.json(
      { error: "Error actualizando suscripción" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        gift: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
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
    console.error("❌ Error cargando suscripción:", error);
    return NextResponse.json(
      { error: "Error cargando suscripción" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// GET — ediciones con PDF disponibles para el suscriptor actual
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const invitation = await prisma.pdfAboInvitation.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { isRedeemed: true, startDate: true, endDate: true },
    });

    // Verificar que tiene ABO activo
    if (
      !invitation ||
      !invitation.isRedeemed ||
      (invitation.endDate && invitation.endDate < new Date())
    ) {
      return NextResponse.json({ error: "Sin acceso PDF-Abo" }, { status: 403 });
    }

    // Ediciones publicadas desde el startDate del suscriptor, que tengan PDF cargado
    const editions = await prisma.edition.findMany({
      where: {
        datePublished: { gte: invitation.startDate },
        pdf: { isNot: null },
      },
      orderBy: { number: "desc" },
      select: {
        id: true,
        number: true,
        title: true,
        titleES: true,
        datePublished: true,
        coverImage: true,
        pdf: {
          select: { pdfUrl: true, fileSize: true },
        },
      },
    });

    return NextResponse.json({ editions, startDate: invitation.startDate });
  } catch (error) {
    console.error("❌ Error fetching PDF-Abo editions:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

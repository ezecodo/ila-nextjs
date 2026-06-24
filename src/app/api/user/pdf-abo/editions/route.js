import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { hasAboAccess } from "@/lib/aboAccess";

// GET — ediciones con PDF disponibles para el suscriptor actual
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!(await hasAboAccess(session))) {
      return NextResponse.json({ error: "Sin acceso PDF-Abo" }, { status: 403 });
    }

    // El startDate solo aplica a abonados con invitación (admins y traductores
    // acceden por su rol, sin fecha de alta del ABO).
    const role = session.user.role;
    let invitation = null;
    if (role !== "admin" && role !== "translator") {
      invitation = await prisma.pdfAboInvitation.findUnique({
        where: { email: session.user.email.toLowerCase() },
        select: { startDate: true },
      });
    }

    // Todas las ediciones que tengan PDF cargado (sin límite por fecha de alta)
    const editions = await prisma.edition.findMany({
      where: {
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

    return NextResponse.json({
      editions,
      startDate: invitation?.startDate ?? null,
    });
  } catch (error) {
    console.error("❌ Error fetching PDF-Abo editions:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

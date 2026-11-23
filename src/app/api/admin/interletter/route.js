import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { requireAdmin } from "@/lib/apiAuth";
import { interletterSubject } from "@/lib/interletterEmail";

// GET /api/admin/interletter — borradores + enviados (archivo).
// La lista no trae `content` (puede ser grande); se pide por id al abrir.
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await prisma.interletter.findMany({
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
      select: {
        id: true,
        status: true,
        subject: true,
        createdAt: true,
        updatedAt: true,
        updatedByEmail: true,
        sentAt: true,
        sentByEmail: true,
        recipientCount: true,
        failedCount: true,
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("❌ Error InterLetter GET:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/interletter — crea un borrador. Body: { content }
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const session = await auth();
    const { content } = await req.json();
    if (!content || typeof content !== "object") {
      return NextResponse.json({ error: "Sin contenido" }, { status: 400 });
    }
    const item = await prisma.interletter.create({
      data: {
        status: "draft",
        subject: interletterSubject(content).slice(0, 500),
        content,
        updatedByEmail: session?.user?.email || null,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("❌ Error InterLetter POST:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

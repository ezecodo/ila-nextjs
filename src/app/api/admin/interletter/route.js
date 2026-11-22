import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

// GET /api/admin/interletter — archivo de InterLetter enviados (con el
// contenido, para volver a ver la Vorschau o reutilizarlo como borrador).
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const items = await prisma.interletter.findMany({
      orderBy: { sentAt: "desc" },
      take: 100,
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("❌ Error InterLetter archive GET:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

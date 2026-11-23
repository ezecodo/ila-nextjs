import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { requireAdmin } from "@/lib/apiAuth";
import { interletterSubject } from "@/lib/interletterEmail";

// GET /api/admin/interletter/[id] — un InterLetter completo (con content).
export async function GET(req, context) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const item = await prisma.interletter.findUnique({ where: { id: Number(id) } });
    if (!item) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error("❌ Error InterLetter GET id:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// PUT /api/admin/interletter/[id] — guarda un BORRADOR.
// Body: { content, baseUpdatedAt } — control optimista: si alguien más guardó
// después de `baseUpdatedAt`, devuelve 409 con quién y cuándo, sin pisar nada
// (varias personas de la AG Web pueden tener el mismo borrador abierto).
export async function PUT(req, context) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const session = await auth();
    const { content, baseUpdatedAt } = await req.json();
    if (!content || typeof content !== "object") {
      return NextResponse.json({ error: "Sin contenido" }, { status: 400 });
    }

    const current = await prisma.interletter.findUnique({ where: { id: Number(id) } });
    if (!current) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    if (current.status !== "draft") {
      return NextResponse.json({ error: "Bereits versendet", status: current.status }, { status: 409 });
    }
    if (baseUpdatedAt && new Date(current.updatedAt).getTime() > new Date(baseUpdatedAt).getTime()) {
      return NextResponse.json(
        {
          error: "conflict",
          updatedAt: current.updatedAt,
          updatedByEmail: current.updatedByEmail,
        },
        { status: 409 },
      );
    }

    const item = await prisma.interletter.update({
      where: { id: Number(id) },
      data: {
        subject: interletterSubject(content).slice(0, 500),
        content,
        updatedByEmail: session?.user?.email || null,
      },
      select: { id: true, status: true, updatedAt: true, updatedByEmail: true },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("❌ Error InterLetter PUT:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE — solo borradores (lo enviado queda en el archivo).
export async function DELETE(req, context) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const { count } = await prisma.interletter.deleteMany({
      where: { id: Number(id), status: "draft" },
    });
    if (!count) return NextResponse.json({ error: "Nur Entwürfe können gelöscht werden" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error InterLetter DELETE:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// GET — lista de corridas de backup (solo admin, consumido por el dashboard)
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const backups = await prisma.backupLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 90,
    });

    return NextResponse.json(backups);
  } catch (error) {
    console.error("❌ Error fetching backups:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

// POST — registrar una corrida del backup. La llama el script de cron del
// servidor Hetzner, no un usuario logueado: se autentica con un secreto
// compartido (header Authorization) en vez de sesión NextAuth.
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const expected = `Bearer ${process.env.BACKUP_LOG_SECRET}`;
    if (!process.env.BACKUP_LOG_SECRET || authHeader !== expected) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      sizeBytes,
      destination,
      fileName,
      errorMessage,
      filesTransferred,
    } = body;

    if (!status || !destination) {
      return NextResponse.json(
        { error: "status y destination son requeridos" },
        { status: 400 },
      );
    }

    const log = await prisma.backupLog.create({
      data: {
        status,
        sizeBytes: sizeBytes ?? null,
        destination,
        fileName: fileName ?? null,
        errorMessage: errorMessage ?? null,
        filesTransferred: filesTransferred ?? null,
      },
    });

    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error) {
    console.error("❌ Error logging backup:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

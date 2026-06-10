import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Si quieres protegerlo, dejamos auth. Si te aparece 401, asegúrate de estar logueado.
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // e.g. "translator"
    const q = searchParams.get("q"); // opcional: búsqueda por nombre/email
    const withStats = searchParams.get("withStats") === "1"; // alta + nº asignados
    // Conjunto "asignable para traducir": traductores reales + cualquier usuario
    // (p. ej. un admin) habilitado manualmente con canTranslate=true.
    const assignable = searchParams.get("assignable") === "1";

    const where = {};

    if (assignable) {
      where.OR = [{ role: "translator" }, { canTranslate: true }];
    } else if (role) {
      // Prisma acepta el string del enum (si tu enum Role ya incluye "translator")
      where.role = role;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ];
    }

    const select = {
      id: true,
      name: true,
      email: true,
      username: true,
      image: true,
      role: true,
      canTranslate: true,
    };

    if (withStats) {
      select.createdAt = true;
      select.emailVerified = true;
      select._count = { select: { translationsAssigned: true } };
    }

    const users = await prisma.user.findMany({
      where,
      select,
      orderBy: [{ name: "asc" }, { email: "asc" }],
      take: 200, // tope razonable
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

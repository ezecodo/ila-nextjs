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

    const where = {};

    if (role) {
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

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
      },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      take: 200, // tope razonable
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

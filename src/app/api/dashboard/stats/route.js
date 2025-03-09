import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const totalArticles = await prisma.article.count();
    const totalEditions = await prisma.edition.count();
    const totalUsers = await prisma.user.count();

    return NextResponse.json({
      totalArticles,
      totalEditions,
      totalUsers,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error al cargar estadísticas" },
      { status: 500 }
    );
  }
}

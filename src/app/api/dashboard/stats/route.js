import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const totalArticles = await prisma.article.count();
    const totalEditions = await prisma.edition.count();
    const totalUsers = await prisma.user.count();
    const totalLikedArticles = await prisma.favorite.count(); // ✅ Nueva métrica
    const totalEvents = await prisma.event.count();

    return NextResponse.json({
      totalEvents,
      totalArticles,
      totalEditions,
      totalUsers,
      totalLikedArticles, // ✅ Devolvemos la cantidad de artículos likeados
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json(
      { error: "Error al cargar estadísticas" },
      { status: 500 }
    );
  }
}

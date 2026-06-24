import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Cuenta las asignaciones "nuevas" del traductor actual: artículos que tiene
// asignados pero que todavía no abrió (translationStartedAt null) ni envió.
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ newCount: 0 }, { status: 401 });
    }

    const newCount = await prisma.article.count({
      where: {
        translatorId: session.user.id,
        translationStartedAt: null,
        translationStatus: { notIn: ["submitted", "approved"] },
      },
    });

    return NextResponse.json({ newCount });
  } catch (error) {
    console.error("❌ Error contando asignaciones nuevas:", error);
    return NextResponse.json({ newCount: 0 }, { status: 500 });
  }
}

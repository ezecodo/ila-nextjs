import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Cuenta los artículos que están esperando revisión (needsReviewES = true).
// Es el campo que marca explícitamente "necesita revisión en ES": en el flujo
// normal se activa al enviar (submitted), pero se gestiona por separado para
// poder sacar de la cola los que ya se dieron por revisados sin tener que
// cambiar el translationStatus. Lo usa el dashboard para el aviso en
// "Übersetzungen", igual que el punto de "Bestellungen".
export async function GET() {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "admin" && role !== "reviewer") {
      return NextResponse.json({ reviewCount: 0 }, { status: 401 });
    }

    const reviewCount = await prisma.article.count({
      where: { needsReviewES: true },
    });

    return NextResponse.json({ reviewCount });
  } catch (error) {
    console.error("❌ Error contando artículos por revisar:", error);
    return NextResponse.json({ reviewCount: 0 }, { status: 500 });
  }
}

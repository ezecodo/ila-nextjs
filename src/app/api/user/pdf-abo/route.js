import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// GET — comprueba si el usuario actual tiene PDF ABO activo
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ hasPdfAbo: false }, { status: 401 });
    }

    const invitation = await prisma.pdfAboInvitation.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { isRedeemed: true, startDate: true, endDate: true },
    });

    const hasPdfAbo =
      !!invitation &&
      invitation.isRedeemed &&
      (!invitation.endDate || invitation.endDate > new Date());

    return NextResponse.json({ hasPdfAbo });
  } catch (error) {
    console.error("❌ Error checking PDF ABO:", error);
    return NextResponse.json({ hasPdfAbo: false }, { status: 500 });
  }
}

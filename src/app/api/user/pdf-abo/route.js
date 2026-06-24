import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { hasAboAccess } from "@/lib/aboAccess";

// GET — comprueba si el usuario actual tiene PDF ABO activo
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ hasPdfAbo: false }, { status: 401 });
    }

    const hasPdfAbo = await hasAboAccess(session);
    return NextResponse.json({ hasPdfAbo });
  } catch (error) {
    console.error("❌ Error checking PDF ABO:", error);
    return NextResponse.json({ hasPdfAbo: false }, { status: 500 });
  }
}

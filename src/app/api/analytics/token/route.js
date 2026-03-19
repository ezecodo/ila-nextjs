import { NextResponse } from "next/server";
import { auth } from "@/app/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = process.env.MATOMO_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Token no configurado" }, { status: 500 });
  }

  return NextResponse.json({ token });
}

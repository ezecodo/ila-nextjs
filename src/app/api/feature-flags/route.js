import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { readFlags, writeFlags } from "@/lib/featureFlags";

// Solo este email puede modificar los flags (el "Cuarto" es privado).
const SUPER_ADMIN_EMAIL = "e.zeangeloni@gmail.com";

// Lectura pública: la usa la página de artículo para decidir si muestra
// el botón "Escuchar" según la audiencia del que mira.
export async function GET() {
  try {
    const flags = await readFlags();
    return NextResponse.json(flags);
  } catch (error) {
    console.error("❌ Error en GET feature-flags:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    const session = await auth();
    if (session?.user?.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const body = await req.json();
    const flags = await writeFlags(body);
    return NextResponse.json(flags);
  } catch (error) {
    console.error("❌ Error en PUT feature-flags:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

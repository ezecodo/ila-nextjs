import { NextResponse } from "next/server";
import { auth } from "@/app/auth";

// Guard de rol para route handlers de /api (el middleware NO cubre /api —
// ver matcher en src/middleware.js, excluye "api"). Cada ruta que escribe o
// lee datos sensibles tiene que chequear por su cuenta.
//
// Uso:
//   const denied = await requireAdmin();
//   if (denied) return denied;   // 401 si no hay sesión admin
//
// Mismo criterio que las rutas ya protegidas (backups, pdf-abo, etc.):
// session.user.role === "admin". Devuelve null si está autorizado.
export async function requireAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

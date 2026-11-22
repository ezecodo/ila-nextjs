import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Baja del InterLetter — PÚBLICO, se autentica con el token único de cada
// persona (cuid, no adivinable).
//
// GET  ?token=  → estado para la página de baja (email enmascarado). No da de
//                 baja: los escáneres de correo abren los links solos.
// POST ?token=  → da de baja. Lo usa el botón de la página y la baja "en un
//                 clic" del programa de correo (header List-Unsubscribe-Post,
//                 RFC 8058, que manda POST al link del header).

function maskEmail(email) {
  const [user, domain] = String(email).split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function tokenFrom(req) {
  return new URL(req.url).searchParams.get("token") || "";
}

export async function GET(req) {
  try {
    const token = tokenFrom(req);
    const r = token
      ? await prisma.interletterRecipient.findUnique({ where: { unsubscribeToken: token } })
      : null;
    if (!r) return NextResponse.json({ found: false });
    return NextResponse.json({
      found: true,
      email: maskEmail(r.email),
      unsubscribed: !!r.unsubscribedAt,
    });
  } catch (error) {
    console.error("❌ Error InterLetter unsubscribe GET:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = tokenFrom(req);
    if (!token) return NextResponse.json({ found: false }, { status: 400 });
    const { count } = await prisma.interletterRecipient.updateMany({
      where: { unsubscribeToken: token, unsubscribedAt: null },
      data: { unsubscribedAt: new Date() },
    });
    const exists =
      count > 0 ||
      !!(await prisma.interletterRecipient.findUnique({ where: { unsubscribeToken: token } }));
    return NextResponse.json({ found: exists, success: exists });
  } catch (error) {
    console.error("❌ Error InterLetter unsubscribe POST:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

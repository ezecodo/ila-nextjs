import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { EMAIL_RE, cleanLanguages } from "@/lib/interletterEmail";

// GET /api/admin/interletter/recipients — lista completa (activos y dados de baja)
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const recipients = await prisma.interletterRecipient.findMany({
      orderBy: [{ unsubscribedAt: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        languages: true,
        consentNote: true,
        unsubscribedAt: true,
        createdAt: true,
        _count: { select: { deliveries: true } },
      },
    });
    return NextResponse.json(recipients);
  } catch (error) {
    console.error("❌ Error InterLetter recipients GET:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/admin/interletter/recipients
// Body: { items: [{ name, email, languages?, consentNote? }] } — alta de una
// persona o importación en bloque. Emails ya existentes se saltean (no se
// pisan sus datos ni se reactiva a quien se dio de baja).
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Sin datos" }, { status: 400 });
    }

    const invalid = [];
    const valid = new Map();
    for (const it of items) {
      const email = String(it?.email || "").trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        invalid.push(it?.email || it?.name || "?");
        continue;
      }
      valid.set(email, {
        email,
        name: String(it?.name || "").trim() || email.split("@")[0],
        languages: cleanLanguages(it?.languages),
        consentNote: String(it?.consentNote || "").trim() || null,
      });
    }

    const existing = await prisma.interletterRecipient.findMany({
      where: { email: { in: [...valid.keys()] } },
      select: { email: true },
    });
    const existingSet = new Set(existing.map((e) => e.email));
    const toCreate = [...valid.values()].filter((v) => !existingSet.has(v.email));

    if (toCreate.length) {
      await prisma.interletterRecipient.createMany({ data: toCreate, skipDuplicates: true });
    }

    return NextResponse.json({
      success: true,
      created: toCreate.length,
      skipped: [...existingSet],
      invalid,
    });
  } catch (error) {
    console.error("❌ Error InterLetter recipients POST:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

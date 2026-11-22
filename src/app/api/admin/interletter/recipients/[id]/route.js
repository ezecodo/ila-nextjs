import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { EMAIL_RE, cleanLanguages } from "@/lib/interletterEmail";

// PATCH /api/admin/interletter/recipients/[id] — editar nombre/email/idiomas/nota.
// La baja la decide la persona (link en el mail); acá no se reactiva a nadie.
export async function PATCH(req, context) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    const body = await req.json();
    const data = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: "E-Mail ungültig" }, { status: 400 });
      }
      data.email = email;
    }
    if (body.languages !== undefined) data.languages = cleanLanguages(body.languages);
    if (body.consentNote !== undefined) data.consentNote = String(body.consentNote).trim() || null;

    const recipient = await prisma.interletterRecipient.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ success: true, recipient });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "E-Mail existiert bereits" }, { status: 409 });
    }
    console.error("❌ Error InterLetter recipient PATCH:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// DELETE — borrado definitivo (con su historial de entregas, por RGPD).
export async function DELETE(req, context) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    await prisma.interletterRecipient.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error InterLetter recipient DELETE:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

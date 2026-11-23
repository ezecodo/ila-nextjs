import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { requireAdmin } from "@/lib/apiAuth";
import { interletterSubject } from "@/lib/interletterEmail";
import { resend, buildInterletterMessage } from "@/lib/interletterMail";

const BATCH = 100; // máximo de resend.batch.send por llamada

// POST /api/admin/interletter/send
// Body: { id, expectedCount } — manda el BORRADOR GUARDADO `id` a todas las
// personas activas (un mail por persona, nunca CCO) y lo pasa a "sent".
// `expectedCount` = cuántas personas vio el admin al confirmar: si la lista
// cambió entre tanto, no se manda nada.
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const session = await auth();
    const { id, expectedCount } = await req.json();
    const existing = await prisma.interletter.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Dieser InterLetter wurde bereits versendet." }, { status: 409 });
    }
    const draft = existing.content;

    const recipients = await prisma.interletterRecipient.findMany({
      where: { unsubscribedAt: null },
      orderBy: { id: "asc" },
    });
    if (recipients.length === 0) {
      return NextResponse.json({ error: "Keine Empfänger*innen" }, { status: 400 });
    }
    if (Number(expectedCount) !== recipients.length) {
      return NextResponse.json(
        { error: "Die Empfängerliste hat sich geändert – bitte neu laden.", count: recipients.length },
        { status: 409 },
      );
    }

    // Marcar como enviado ANTES de mandar: si dos personas tocan "Senden" a la
    // vez, solo una pasa este updateMany (la otra recibe 409, sin duplicados).
    const { count: claimed } = await prisma.interletter.updateMany({
      where: { id: existing.id, status: "draft" },
      data: {
        status: "sent",
        subject: interletterSubject(draft).slice(0, 500),
        sentAt: new Date(),
        sentByEmail: session?.user?.email || null,
        recipientCount: recipients.length,
      },
    });
    if (!claimed) {
      return NextResponse.json({ error: "Dieser InterLetter wurde bereits versendet." }, { status: 409 });
    }
    const interletter = { id: existing.id };

    let failed = 0;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const chunk = recipients.slice(i, i + BATCH);
      let deliveries;
      try {
        const { data, error } = await resend.batch.send(
          chunk.map((r) => buildInterletterMessage(draft, r)),
        );
        if (error) throw new Error(error.message || "Resend error");
        const ids = data?.data || [];
        deliveries = chunk.map((r, j) => ({
          interletterId: interletter.id,
          recipientId: r.id,
          resendId: ids[j]?.id || null,
          status: "sent",
        }));
      } catch (err) {
        // Resend valida el lote entero: si falla, falla todo el bloque.
        console.error("❌ InterLetter batch error:", err);
        Sentry.captureException(err);
        failed += chunk.length;
        deliveries = chunk.map((r) => ({
          interletterId: interletter.id,
          recipientId: r.id,
          status: "failed",
          error: String(err?.message || err).slice(0, 2000),
        }));
      }
      await prisma.interletterDelivery.createMany({ data: deliveries });
    }

    if (failed) {
      await prisma.interletter.update({
        where: { id: interletter.id },
        data: { failedCount: failed },
      });
    }

    return NextResponse.json({
      success: failed === 0,
      id: interletter.id,
      sent: recipients.length - failed,
      failed,
    });
  } catch (error) {
    console.error("❌ Error InterLetter send:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

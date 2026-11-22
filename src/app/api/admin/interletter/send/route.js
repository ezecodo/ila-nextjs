import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { requireAdmin } from "@/lib/apiAuth";
import { interletterSubject } from "@/lib/interletterEmail";
import { resend, buildInterletterMessage } from "@/lib/interletterMail";

const BATCH = 100; // máximo de resend.batch.send por llamada

// POST /api/admin/interletter/send
// Body: { draft, expectedCount } — manda el InterLetter a todas las personas
// activas (un mail por persona, nunca CCO) y lo guarda en el archivo.
// `expectedCount` = cuántas personas vio el admin al confirmar: si la lista
// cambió entre tanto, no se manda nada.
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const session = await auth();
    const { draft, expectedCount } = await req.json();
    if (!draft || typeof draft !== "object") {
      return NextResponse.json({ error: "Sin contenido" }, { status: 400 });
    }

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

    const interletter = await prisma.interletter.create({
      data: {
        subject: interletterSubject(draft).slice(0, 500),
        content: draft,
        sentByEmail: session?.user?.email || null,
        recipientCount: recipients.length,
      },
    });

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

import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/app/auth";
import { requireAdmin } from "@/lib/apiAuth";
import { EMAIL_RE } from "@/lib/interletterEmail";
import { resend, buildInterletterMessage, inlineHeaderAttachments } from "@/lib/interletterMail";

// Máximo de direcciones por Testmail (es una prueba, no un envío).
const MAX_TEST_TO = 5;

// POST /api/admin/interletter/test-send
// Body: { draft, to?: string[] } — manda el borrador como Testmail a `to`
// (por defecto, el email del admin logueado), igual que lo recibiría un
// destinatario (link de baja de prueba, sin efecto). Un mail por dirección:
// nadie ve las otras. El header va embebido en el mail para poder probar
// antes del deploy.
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const session = await auth();
    const body = await req.json();
    // Compatibilidad: antes el body era el borrador directamente.
    const draft = body?.draft || body;

    const requested = Array.isArray(body?.to) ? body.to : [];
    const to = [
      ...new Set(
        (requested.length ? requested : [session?.user?.email])
          .map((e) => String(e || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
    if (!to.length) {
      return NextResponse.json({ error: "Keine Adresse" }, { status: 400 });
    }
    if (to.length > MAX_TEST_TO) {
      return NextResponse.json({ error: `Höchstens ${MAX_TEST_TO} Adressen` }, { status: 400 });
    }
    const invalid = to.filter((e) => !EMAIL_RE.test(e));
    if (invalid.length) {
      return NextResponse.json({ error: `Ungültige Adresse: ${invalid.join(", ")}` }, { status: 400 });
    }

    const { attachments, headerSrc } = await inlineHeaderAttachments(draft);
    const sent = [];
    const failed = [];
    for (const email of to) {
      const msg = buildInterletterMessage(draft, { email, unsubscribeToken: "test" }, { headerSrc });
      msg.attachments = attachments;
      msg.subject = `[TEST] ${msg.subject}`;
      const { error } = await resend.emails.send(msg);
      if (error) {
        console.error("❌ InterLetter test-send:", email, error);
        failed.push(email);
      } else {
        sent.push(email);
      }
    }

    if (!sent.length) throw new Error("Resend error");
    return NextResponse.json({ success: failed.length === 0, to: sent, failed });
  } catch (error) {
    console.error("❌ Error InterLetter test-send:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

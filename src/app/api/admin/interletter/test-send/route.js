import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/app/auth";
import { requireAdmin } from "@/lib/apiAuth";
import { resend, buildInterletterMessage, inlineHeaderAttachments } from "@/lib/interletterMail";

// POST /api/admin/interletter/test-send
// Manda el borrador SOLO al email del admin logueado, igual que lo recibiría
// un destinatario (link de baja de prueba, sin efecto). El header va
// embebido en el mail para poder probar antes del deploy.
export async function POST(req) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const session = await auth();
    const to = session?.user?.email;
    if (!to) {
      return NextResponse.json({ error: "Sin email en la sesión" }, { status: 400 });
    }

    const draft = await req.json();
    const { attachments, headerSrc } = await inlineHeaderAttachments(draft);
    const msg = buildInterletterMessage(draft, { email: to, unsubscribeToken: "test" }, { headerSrc });
    msg.attachments = attachments;
    msg.subject = `[TEST] ${msg.subject}`;

    const { data, error } = await resend.emails.send(msg);
    if (error) throw new Error(error.message || "Resend error");

    return NextResponse.json({ success: true, to, id: data?.id });
  } catch (error) {
    console.error("❌ Error InterLetter test-send:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

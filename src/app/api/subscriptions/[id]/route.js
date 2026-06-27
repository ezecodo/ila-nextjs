import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendPdfAboInvitationEmail } from "@/lib/email";

// 🔹 Obtener una suscripción por ID

export async function GET(request, context) {
  try {
    const params = await context.params; // ✅ se espera primero
    const { id } = params; // luego se usa con seguridad

    if (!id) {
      return NextResponse.json({ error: "ID faltante" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        gift: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Suscripción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("❌ Error en GET /api/subscriptions/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
export async function PATCH(req, context) {
  try {
    const { id } = await context.params;

    const updated = await prisma.subscription.update({
      where: { id: String(id) },
      data: { isNew: false },
    });

    // 🔗 Digital ABO: las suscripciones NORMAL_PDF dan acceso a los dossiers
    // privados. Al procesarlas, damos de alta al beneficiario en el sistema
    // PDF-Abo y le enviamos el email de invitación.
    let pdfAbo = null;
    if (updated.type === "NORMAL_PDF") {
      const email = updated.isGift
        ? updated.giftRecipientEmail || updated.email
        : updated.email;
      const name = updated.isGift
        ? updated.giftRecipientName ||
          `${updated.firstName} ${updated.lastName}`.trim()
        : `${updated.firstName} ${updated.lastName}`.trim();

      if (email) {
        const normalizedEmail = email.toLowerCase();
        const existing = await prisma.pdfAboInvitation.findUnique({
          where: { email: normalizedEmail },
        });

        const invitation =
          existing ||
          (await prisma.pdfAboInvitation.create({
            data: {
              email: normalizedEmail,
              name: name || null,
              startDate: new Date(),
            },
          }));

        pdfAbo = {
          email: invitation.email,
          alreadyExisted: Boolean(existing),
          isRedeemed: invitation.isRedeemed,
          emailSent: false,
        };

        // Solo enviamos el email si la invitación aún no fue activada.
        if (!invitation.isRedeemed) {
          try {
            await sendPdfAboInvitationEmail(invitation.email, name || "");
            pdfAbo.emailSent = true;
          } catch (mailErr) {
            console.error(
              "⚠️ Suscripción procesada pero falló el envío del email PDF-Abo:",
              mailErr
            );
          }
        }
      }
    }

    return NextResponse.json({ ...updated, pdfAbo }, { status: 200 });
  } catch (error) {
    console.error("❌ Error marcando suscripción como procesada:", error);
    return NextResponse.json(
      { error: "Error actualizando suscripción" },
      { status: 500 }
    );
  }
}

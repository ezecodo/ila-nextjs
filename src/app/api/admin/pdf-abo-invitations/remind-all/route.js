import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { sendPdfAboReminderEmail } from "@/lib/email";

const DELAY_BETWEEN_EMAILS_MS = 550; // Resend rate-limits a ~2 req/s

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// POST - Enviar recordatorio a todas las invitaciones pendientes (isRedeemed: false)
export async function POST() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const pending = await prisma.pdfAboInvitation.findMany({
      where: { isRedeemed: false },
    });

    let sent = 0;
    const failed = [];

    for (const invitation of pending) {
      try {
        await sendPdfAboReminderEmail(invitation.email, invitation.name || "");
        await prisma.pdfAboInvitation.update({
          where: { id: invitation.id },
          data: { reminderSentAt: new Date() },
        });
        sent += 1;
      } catch (error) {
        console.error(`❌ Error al recordar a ${invitation.email}:`, error);
        failed.push(invitation.email);
      }
      await sleep(DELAY_BETWEEN_EMAILS_MS);
    }

    return NextResponse.json({
      message: "Recordatorios procesados",
      total: pending.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Error al enviar recordatorios masivos:", error);
    return NextResponse.json(
      { message: "Error al enviar recordatorios" },
      { status: 500 },
    );
  }
}

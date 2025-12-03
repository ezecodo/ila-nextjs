import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendSubscriptionConfirmationEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const data = await req.json();
    const isGift = Boolean(data.isGift);

    // 🎯 Lógica mejorada: duración del abo-regalo para todos los tipos menos TRIAL
    const validForDuration = [
      "NORMAL",
      "NORMAL_PDF",
      "SUPPORTER",
      "REDUCED",
    ].includes(data.type);

    const giftSubscriptionDuration =
      isGift && validForDuration
        ? ["ONE_YEAR", "UNTIL_CANCELLED"].includes(
            data.giftSubscriptionDuration
          )
          ? data.giftSubscriptionDuration
          : "ONE_YEAR" // valor por defecto si no se selecciona nada
        : null;

    const subscription = await prisma.subscription.create({
      data: {
        type: data.type,
        format: data.format,
        salutation: data.salutation || null,
        firstName: data.firstName,
        lastName: data.lastName,
        institution: data.institution || null,
        street: data.street,
        addressExtra: data.addressExtra || null,
        zip: data.zip,
        city: data.city,
        country: data.country || "Deutschland",
        phone: data.phone || null,
        email: data.email,
        message: data.message || null,
        donationExtra: data.donationExtra ? Number(data.donationExtra) : null,
        isGift,
        startYear: new Date().getFullYear(),
        giftRecipientName: data.giftRecipientName || null,
        giftRecipientEmail: data.giftRecipientEmail || null,
        giftRecipientStreet: data.giftRecipientStreet || null,
        giftRecipientZip: data.giftRecipientZip || null,
        giftRecipientCity: data.giftRecipientCity || null,
        giftRecipientCountry: data.giftRecipientCountry || null,
        giftDelivery: isGift ? data.giftDelivery || "to_payer" : null,
        giftSubscriptionDuration,
        // 🎁 Promo de fin de año: regalo adicional de 3 meses
        promoGiftRecipientName: data.promoGiftRecipientName || null,
        promoGiftRecipientEmail: data.promoGiftRecipientEmail || null,
        promoGiftRecipientStreet: data.promoGiftRecipientStreet || null,
        promoGiftRecipientZip: data.promoGiftRecipientZip || null,
        promoGiftRecipientCity: data.promoGiftRecipientCity || null,
        promoGiftRecipientCountry: data.promoGiftRecipientCountry || null,
        giftId: data.giftId || null,
        termsAccepted: data.termsAccepted,
        withdrawalAccepted: data.withdrawalAccepted,
        dataConsentAccepted: data.dataConsentAccepted,
        isNew: true, // 👈 NUEVO: marcar la suscripción como nueva
      },
    });
    // ✅ NUEVO: enviar email de confirmación
    const fullSubscription = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: { gift: true },
    });
    await sendSubscriptionConfirmationEmail(fullSubscription);
    return Response.json({ success: true, subscription });
  } catch (err) {
    console.error("❌ Error creating subscription:", err);
    return Response.json({ success: false, error: err.message });
  }
}

export async function GET() {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        gift: {
          select: { id: true, name: true },
        },
      },
    });

    // 👇 NUEVO: contador de suscripciones nuevas
    const newSubscriptionsCount = await prisma.subscription.count({
      where: { isNew: true },
    });

    // 🔹 Devolvemos ambas cosas
    return NextResponse.json({ subscriptions, newSubscriptionsCount });
  } catch (error) {
    console.error("❌ Error cargando suscripciones:", error);
    return NextResponse.json(
      { error: "Error cargando suscripciones", details: error.message },
      { status: 500 }
    );
  }
}

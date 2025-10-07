import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();

    // ✅ Validaciones básicas
    const requiredFields = [
      "firstName",
      "lastName",
      "street",
      "zip",
      "city",
      "country",
      "email",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing field: ${field}` },
          { status: 400 }
        );
      }
    }

    // ✅ Crear la suscripción
    const subscription = await prisma.subscription.create({
      data: {
        type: data.type,
        format: data.format,
        donationExtra: data.donationExtra || null,
        isGift: data.isGift || false,
        startYear: data.startYear || new Date().getFullYear(),

        salutation: data.salutation || null,
        firstName: data.firstName,
        lastName: data.lastName,
        institution: data.institution || null,
        street: data.street,
        addressExtra: data.addressExtra || null,
        zip: data.zip,
        city: data.city,
        country: data.country,
        phone: data.phone || null,
        email: data.email,
        message: data.message || null,

        // 🎁 Datos del regalo
        giftRecipientName: data.giftRecipientName || null,
        giftRecipientEmail: data.giftRecipientEmail || null,
        giftRecipientStreet: data.giftRecipientStreet || null,
        giftRecipientZip: data.giftRecipientZip || null,
        giftRecipientCity: data.giftRecipientCity || null,
        giftRecipientCountry: data.giftRecipientCountry || null,
        giftId: data.giftId || null,

        // ✅ Confirmaciones legales
        termsAccepted: data.termsAccepted || false,
        withdrawalAccepted: data.withdrawalAccepted || false,
        dataConsentAccepted: data.dataConsentAccepted || false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Vielen Dank! Ihre Abo-Bestellung wurde erfolgreich gespeichert.",
        subscriptionId: subscription.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Error creating subscription", details: error.message },
      { status: 500 }
    );
  }
}

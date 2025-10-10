import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();

    const subscription = await prisma.subscription.create({
      data: {
        type: data.type,
        format: data.format,
        firstName: data.firstName,
        lastName: data.lastName,
        street: data.street,
        zip: data.zip,
        city: data.city,
        country: data.country || "Deutschland",
        email: data.email,
        giftId: data.giftId,
        termsAccepted: data.termsAccepted,
        withdrawalAccepted: data.withdrawalAccepted,
        dataConsentAccepted: data.dataConsentAccepted,
      },
    });

    return Response.json({ success: true, subscription });
  } catch (err) {
    console.error("Error creating subscription:", err);
    return Response.json({ success: false, error: err.message });
  }
}

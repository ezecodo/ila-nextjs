import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDossierOrderConfirmationEmail } from "@/lib/email";

// 🔹 OBTENER TODOS LOS PEDIDOS + CONTADOR DE NUEVOS
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            edition: true,
          },
        },
        recipients: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 🔹 Contar pedidos nuevos (isNew = true)
    const newOrdersCount = await prisma.order.count({
      where: { isNew: true },
    });

    // 🔹 Devolver ambos datos
    return NextResponse.json({ orders, newOrdersCount }, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// 🔹 CREAR NUEVO PEDIDO
export async function POST(req) {
  try {
    const body = await req.json();
    const { locale } = body;

    const {
      salutation,
      firstName,
      lastName,
      institution,
      street,
      addressExtra,
      zip,
      city,
      country,
      phone,
      email,
      message,
      items,
      recipients,
    } = body;

    // Validación de campos requeridos del comprador
    if (
      !firstName ||
      !lastName ||
      !street ||
      !zip ||
      !city ||
      !country ||
      !email
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Normalizar y validar destinatarios alternativos (máx. 2)
    const recipientsInput = Array.isArray(recipients) ? recipients : [];
    if (recipientsInput.length > 2) {
      return NextResponse.json(
        { error: "Maximum 2 alternate recipients allowed" },
        { status: 400 }
      );
    }
    for (const r of recipientsInput) {
      if (
        !r.firstName ||
        !r.lastName ||
        !r.street ||
        !r.zip ||
        !r.city ||
        !r.country
      ) {
        return NextResponse.json(
          { error: "Missing recipient fields" },
          { status: 400 }
        );
      }
    }

    // Crear pedido + destinatarios + items en transacción
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          salutation,
          firstName,
          lastName,
          institution,
          street,
          addressExtra,
          zip,
          city,
          country,
          phone,
          email,
          message,
          isNew: true,
        },
      });

      const createdRecipients = [];
      for (const r of recipientsInput) {
        const rec = await tx.orderRecipient.create({
          data: {
            orderId: created.id,
            salutation: r.salutation || null,
            firstName: r.firstName,
            lastName: r.lastName,
            institution: r.institution || null,
            street: r.street,
            addressExtra: r.addressExtra || null,
            zip: r.zip,
            city: r.city,
            country: r.country,
            phone: r.phone || null,
          },
        });
        createdRecipients.push(rec);
      }

      for (const item of items) {
        const idx = item.recipientIndex;
        const recipientId =
          idx === 0 || idx === 1 ? createdRecipients[idx]?.id ?? null : null;
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            editionId: Number(item.editionId),
            qty: item.qty,
            recipientId,
          },
        });
      }

      return tx.order.findUnique({
        where: { id: created.id },
        include: {
          items: { include: { edition: true } },
          recipients: true,
        },
      });
    });

    // Intentar enviar email — si falla, NO romper el pedido
    try {
      await sendDossierOrderConfirmationEmail(order, locale);
    } catch (emailErr) {
      console.error("⚠️ Error sending email:", emailErr);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

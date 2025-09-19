import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();

    // 👉 Extraer los datos del pedido y los items
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
    } = body;

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

    // 👉 Crear el pedido en la DB
    const order = await prisma.order.create({
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
        items: {
          create: items.map((item) => ({
            editionId: Number(item.editionId), // 👈 aseguramos Int
            qty: item.qty,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("❌ Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

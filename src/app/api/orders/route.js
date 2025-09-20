import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            edition: true, // 👈 para ver también qué dossier se pidió
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
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

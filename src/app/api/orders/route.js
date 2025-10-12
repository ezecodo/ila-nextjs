import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🔹 OBTENER TODOS LOS PEDIDOS + CONTADOR DE NUEVOS
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            edition: true, // 👈 mantiene lo que ya tenías
          },
        },
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

    // ✅ Agregamos isNew: true
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
        isNew: true, // 👈 marca automáticamente como nuevo
        items: {
          create: items.map((item) => ({
            editionId: Number(item.editionId),
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

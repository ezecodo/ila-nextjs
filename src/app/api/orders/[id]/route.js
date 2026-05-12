import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id: String(id) },
      include: {
        items: {
          include: { edition: true }, // 👉 incluye info de la edición
        },
        recipients: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// 🔹 Marcar pedido como procesado (isNew = false)
export async function PATCH(req, { params }) {
  try {
    const { id } = params;

    const updatedOrder = await prisma.order.update({
      where: { id: String(id) },
      data: { isNew: false },
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("❌ Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

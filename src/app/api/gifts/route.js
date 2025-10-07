import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

// ✅ GET — todos ven los premios activos, admins ven todos
export async function GET() {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    const gifts = await prisma.gift.findMany({
      where: isAdmin ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(gifts);
  } catch (error) {
    console.error("❌ Error fetching gifts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ POST — crear nuevo regalo (solo admin)
export async function POST(req) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, imageUrl, isActive = true } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newGift = await prisma.gift.create({
      data: { name, description, imageUrl, isActive },
    });

    return NextResponse.json(
      { success: true, message: "Gift created successfully", gift: newGift },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating gift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ PUT — actualizar (solo admin)
export async function PUT(req) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, imageUrl, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "Gift ID required" }, { status: 400 });
    }

    const updated = await prisma.gift.update({
      where: { id },
      data: { name, description, imageUrl, isActive },
    });

    return NextResponse.json(
      { success: true, message: "Gift updated", gift: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error updating gift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ✅ DELETE — eliminar (solo admin)
export async function DELETE(req) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Gift ID required" }, { status: 400 });
    }

    await prisma.gift.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Gift deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deleting gift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

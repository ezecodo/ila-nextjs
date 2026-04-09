import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { uploadFile, deleteFile } from "@/lib/localUpload";

// ✅ GET — todos ven los premios activos, admins ven todos
export async function GET() {
  try {
    const session = await auth();
    const isAdmin = session?.user?.role === "admin";

    const gifts = await prisma.gift.findMany({
      where:   isAdmin ? {} : { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(gifts);
  } catch (error) {
    console.error("❌ Error fetching gifts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ POST — crear o actualizar regalo (solo admin)
export async function POST(req) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData        = await req.formData();
    const id              = formData.get("id");
    const currentImageUrl = formData.get("currentImageUrl");

    const name          = formData.get("name");
    const subtitle      = formData.get("subtitle")      || null;
    const description   = formData.get("description")   || null;
    const nameES        = formData.get("nameES")        || null;
    const subtitleES    = formData.get("subtitleES")    || null;
    const descriptionES = formData.get("descriptionES") || null;
    const file          = formData.get("image");

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let imageUrl = currentImageUrl || null;

    if (file && file.size > 0) {
      const { url } = await uploadFile(file, "images/gifts");
      imageUrl = url;
    }

    const isTranslatedES = !!(nameES || subtitleES || descriptionES);
    const giftData = { name, subtitle, description, nameES, subtitleES, descriptionES, isTranslatedES, imageUrl, isActive: true };

    let giftResult;
    if (id) {
      giftResult = await prisma.gift.update({ where: { id }, data: giftData });
      return NextResponse.json({ success: true, message: "Gift updated successfully", gift: giftResult }, { status: 200 });
    } else {
      giftResult = await prisma.gift.create({ data: giftData });
      return NextResponse.json({ success: true, message: "Gift created successfully", gift: giftResult }, { status: 201 });
    }
  } catch (error) {
    console.error("❌ Error processing gift:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 🔴 PUT — eliminar definitivo de la BD y del servidor
export async function PUT(req) {
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

    const gift = await prisma.gift.findUnique({ where: { id } });
    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    if (gift.imageUrl) {
      await deleteFile(gift.imageUrl);
    }

    await prisma.gift.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Gift permanently deleted" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error permanently deleting gift:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ DELETE — desactivar (soft delete)
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

    const updated = await prisma.gift.update({ where: { id }, data: { isActive: false } });

    return NextResponse.json({ success: true, message: "Gift marked as inactive", gift: updated }, { status: 200 });
  } catch (error) {
    console.error("❌ Error deactivating gift:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 🟢 PATCH — reactivar premio
export async function PATCH(req) {
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

    const updated = await prisma.gift.update({ where: { id }, data: { isActive: true } });

    return NextResponse.json({ success: true, message: "Gift reactivated", gift: updated }, { status: 200 });
  } catch (error) {
    console.error("❌ Error reactivating gift:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

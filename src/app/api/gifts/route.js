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

    // ✅ Procesar FormData (para imagen + campos multilanguage + ID)
    const formData = await req.formData();
    const id = formData.get("id"); // <-- Determina si es UPDATE
    const currentImageUrl = formData.get("currentImageUrl"); // <-- Imagen existente

    const name = formData.get("name");
    const subtitle = formData.get("subtitle") || null;
    const description = formData.get("description") || null;

    const nameES = formData.get("nameES") || null;
    const subtitleES = formData.get("subtitleES") || null;
    const descriptionES = formData.get("descriptionES") || null;

    const file = formData.get("image");

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // ✅ Lógica de Imagen y Cloudinary
    let imageUrl = currentImageUrl || null; // Inicia con la URL actual o null

    if (file && file.size > 0) {
      // Subir nueva imagen
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const cloudinary = (await import("cloudinary")).v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "gifts" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      imageUrl = uploadResult.secure_url;
      // TODO: Agregar lógica para ELIMINAR la imagen antigua de Cloudinary si existe
      // y estamos actualizando.
    }

    // ✅ Datos para la DB
    const isTranslatedES = !!(nameES || subtitleES || descriptionES);
    const giftData = {
      name,
      subtitle,
      description,
      nameES,
      subtitleES,
      descriptionES,
      isTranslatedES,
      imageUrl,
      isActive: true, // Asume que es activo
    };

    let giftResult;

    if (id) {
      // ES UNA ACTUALIZACIÓN
      giftResult = await prisma.gift.update({
        where: { id },
        data: giftData,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Gift updated successfully",
          gift: giftResult,
        },
        { status: 200 }
      );
    } else {
      // ES UNA CREACIÓN
      giftResult = await prisma.gift.create({
        data: giftData,
      });
      return NextResponse.json(
        {
          success: true,
          message: "Gift created successfully",
          gift: giftResult,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("❌ Error processing gift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 🔴 DELETE DEFINITIVO — eliminar de la base de datos y Cloudinary
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

    // 1️⃣ Obtener Datos antes de borrar
    const gift = await prisma.gift.findUnique({ where: { id } });

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    // 2️⃣ Borrar la imagen de Cloudinary si existe
    if (gift.imageUrl) {
      const cloudinary = (await import("cloudinary")).v2;

      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Extraer public_id desde URL
      // Ej: https://.../gifts/NAME.jpg → gifts/NAME
      const publicId = gift.imageUrl.split("/").slice(-1)[0].split(".")[0]; // sin extensión

      const fullPublicId = `gifts/${publicId}`;

      try {
        await cloudinary.uploader.destroy(fullPublicId);
        console.log("🗑 Imagen eliminada de Cloudinary:", fullPublicId);
      } catch (err) {
        console.error("⚠ Error deleting Cloudinary image:", err);
      }
    }

    // 3️⃣ Eliminar regalo de la DB
    await prisma.gift.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: "Gift permanently deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error permanently deleting gift:", error);
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

    // 🔥 En vez de borrar → desactivar
    const updated = await prisma.gift.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(
      { success: true, message: "Gift marked as inactive", gift: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error deactivating gift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 🟢 PATCH — reactivar premio (solo admin)
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

    const updated = await prisma.gift.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json(
      { success: true, message: "Gift reactivated", gift: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error reactivating gift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

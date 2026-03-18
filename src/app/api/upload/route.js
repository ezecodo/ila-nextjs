// app/api/upload/route.js
import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "ila/network-logos";
    const customPublicId = formData.get("customPublicId") || null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Convertir archivo a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Subir a Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:${file.type};base64,${buffer.toString("base64")}`,
      {
        folder: folder,
        public_id: customPublicId || `upload_${Date.now()}`,
        overwrite: false,
      }
    );

    return NextResponse.json({
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo", details: error.message },
      { status: 500 }
    );
  }
}

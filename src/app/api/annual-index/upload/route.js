import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const year = parseInt(formData.get("year"));
    const title = formData.get("title") || null;
    const titleES = formData.get("titleES") || null;

    if (!file || !file.type.includes("pdf")) {
      return NextResponse.json(
        { error: "Archivo PDF inválido" },
        { status: 400 },
      );
    }

    const existing = await prisma.annualIndex.findUnique({ where: { year } });
    if (existing) {
      return NextResponse.json(
        { error: `Ya existe el año ${year}` },
        { status: 409 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const downloadFileName = `ila_register_${year}.pdf`;

    const result = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream(
          {
            folder: "ila/annual-index",
            public_id: `Register-${year}`,
            resource_type: "image", // Crucial para permitir transformaciones
            format: "pdf",
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(buffer);
    });

    // Guardamos la URL limpia y los bytes reales
    const registro = await prisma.annualIndex.create({
      data: {
        year,
        title,
        titleES,
        fileUrl: result.secure_url,
        fileName: downloadFileName,
        fileSize: result.bytes,
        uploadedBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, registro });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

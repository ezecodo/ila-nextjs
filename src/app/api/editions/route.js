import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/editions");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET() {
  try {
    const editions = await prisma.edition.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(editions, { status: 200 });
  } catch (error) {
    console.error("Error al obtener las ediciones:", error);
    return NextResponse.json(
      { error: "Error al obtener las ediciones" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();

    const number = parseInt(formData.get("number"), 10);
    const title = formData.get("title");
    const subtitle = formData.get("subtitle") || null;
    const datePublished = formData.get("datePublished");
    const year = parseInt(formData.get("year"), 10);
    const summary = formData.get("summary");
    const tableOfContents = formData.get("tableOfContents") || null;
    const isCurrent = formData.get("isCurrent") === "true";

    const coverImageFile = formData.get("coverImage");
    const backgroundImageFile = formData.get("backgroundImage");

    // Validaciones básicas
    if (!number || !title || isNaN(year) || !summary) {
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    // Función para guardar imágenes
    const saveImage = async (file, fieldName) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileExt = path.extname(file.name);
      const fileName = `${fieldName}-${Date.now()}${fileExt}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      fs.writeFileSync(filePath, buffer);
      return `/uploads/editions/${fileName}`;
    };

    const coverImagePath = await saveImage(coverImageFile, "coverImage");
    const backgroundImagePath = await saveImage(
      backgroundImageFile,
      "backgroundImage"
    );

    const newEdition = await prisma.edition.create({
      data: {
        number,
        title,
        subtitle,
        datePublished: datePublished ? new Date(datePublished) : undefined,
        year,
        summary,
        tableOfContents,
        isCurrent,
        coverImage: coverImagePath,
        backgroundImage: backgroundImagePath,
      },
    });

    return NextResponse.json(newEdition, { status: 201 });
  } catch (error) {
    console.error("Error al crear la edición:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

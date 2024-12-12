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
      include: {
        regions: {
          select: {
            id: true,
            name: true, // Aseguramos que se incluyan los nombres de las regiones
          },
        },
        topics: {
          select: {
            id: true,
            name: true, // También incluimos los temas si son necesarios
          },
        },
      },
    });

    return new Response(JSON.stringify(editions), { status: 200 });
  } catch (error) {
    console.error("Error fetching editions:", error);
    return new Response(JSON.stringify({ error: "Error fetching editions" }), {
      status: 500,
    });
  }
}
export async function POST(req) {
  try {
    const formData = await req.formData();

    const number = parseInt(formData.get("number"), 10);
    const title = formData.get("title");
    const isAvailableToOrder = formData.get("isAvailableToOrder") === "true"; // Capturar el campo del formulario

    const subtitle = formData.get("subtitle") || null;
    const datePublished = formData.get("datePublished");

    const summary = formData.get("summary");
    const tableOfContents = formData.get("tableOfContents") || null;
    const isCurrent = formData.get("isCurrent") === "true";

    const regions = JSON.parse(formData.get("regions") || "[]");
    const topics = JSON.parse(formData.get("topics") || "[]");

    const coverImageFile = formData.get("coverImage");
    const backgroundImageFile = formData.get("backgroundImage");

    // Validaciones básicas
    if (!number || !title || !summary) {
      console.error("Campos obligatorios faltantes:", {
        number,
        title,
        summary,
      });
      return NextResponse.json(
        { error: "Campos obligatorios faltantes" },
        { status: 400 }
      );
    }

    console.log("Datos recibidos:", {
      number,
      title,
      subtitle,
      datePublished,
      summary,
      tableOfContents,
      isCurrent,
      regions,
      topics,
    });

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

    console.log("Paths de imágenes guardados:", {
      coverImagePath,
      backgroundImagePath,
    });

    // Crear nueva edición con asociación de regiones
    const newEdition = await prisma.edition.create({
      data: {
        number,
        title,
        subtitle,
        datePublished: new Date(datePublished),
        summary,
        tableOfContents,
        isCurrent,
        coverImage: coverImagePath,
        isAvailableToOrder,
        backgroundImage: backgroundImagePath,
        regions: regions.length
          ? {
              connect: regions.map((id) => ({ id })), // Conectar múltiples regiones
            }
          : undefined,
        topics: topics.length
          ? {
              connect: topics.map((id) => ({ id })), // Conectar múltiples regiones
            }
          : undefined,
      },
      include: { regions: true }, // Incluir regiones asociadas en la respuesta
      include: { topics: true }, // Incluir los topicos asociadas en la respuesta
    });

    console.log("Edición creada exitosamente:", newEdition);

    return NextResponse.json(newEdition, { status: 201 });
  } catch (error) {
    console.error("Error al crear la edición:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}

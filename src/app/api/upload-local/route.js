import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = "/usr/home/ilaweb/public_html/ila-uploads/images";
const BASE_URL = "https://www.ila-web.de/ila-uploads/images";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Generar nombre único
    const ext = path.extname(file.name) || ".jpg";
    const filename = `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Escribir al disco
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `${BASE_URL}/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error("❌ Error al subir archivo local:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo", details: error.message },
      { status: 500 }
    );
  }
}

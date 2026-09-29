import { NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";
import { uploadFile } from "@/lib/localUpload";

export async function POST(request) {
  const denied = await requireRole(["admin", "translator", "reviewer"]);
  if (denied) return denied;
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    const { url, filename } = await uploadFile(file, "images");

    return NextResponse.json({
      url,
      public_id: filename, // mantenemos el campo por compatibilidad con el resto del código
    });
  } catch (error) {
    console.error("❌ Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo", details: error.message },
      { status: 500 }
    );
  }
}

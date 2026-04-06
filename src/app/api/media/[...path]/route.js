import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const MEDIA_DIR = "/usr/home/ilaweb/ila-uploads";

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(_request, { params }) {
  try {
    const { path: pathParts } = await params;
    const relativePath = pathParts.join("/");

    // Seguridad: evitar path traversal (ej: ../../etc/passwd)
    const fullPath = path.join(MEDIA_DIR, relativePath);
    if (!fullPath.startsWith(MEDIA_DIR)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const buffer = await readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }
    console.error("❌ Error sirviendo media:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

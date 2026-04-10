import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, deleteFile } from "@/lib/localUpload";

// GET — obtener el PDF ABO de una edición
export async function GET(_req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const pdf = await prisma.editionPdf.findUnique({
      where: { editionId: Number(id) },
    });

    return NextResponse.json(pdf || null);
  } catch (error) {
    console.error("❌ Error GET edition pdf-abo:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST — subir / reemplazar el PDF ABO de una edición
export async function POST(req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const editionId = Number(id);

    const edition = await prisma.edition.findUnique({ where: { id: editionId } });
    if (!edition) {
      return NextResponse.json({ error: "Edición no encontrada" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }

    // Eliminar PDF anterior si existe
    const existing = await prisma.editionPdf.findUnique({ where: { editionId } });
    if (existing?.pdfUrl) {
      await deleteFile(existing.pdfUrl);
    }

    // Subir nuevo PDF a pdfs-private/editions/<number>/
    const subfolder = `pdfs-private/editions/${edition.number}`;
    const prefix = `ila_${edition.number}`;
    const { url } = await uploadFile(file, subfolder, prefix);

    // Calcular tamaño en bytes
    const fileSize = file.size || null;

    // Upsert en BD
    const pdf = await prisma.editionPdf.upsert({
      where: { editionId },
      create: { editionId, pdfUrl: url, fileSize },
      update: { pdfUrl: url, fileSize, uploadedAt: new Date() },
    });

    return NextResponse.json(pdf, { status: 201 });
  } catch (error) {
    console.error("❌ Error POST edition pdf-abo:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE — eliminar el PDF ABO de una edición
export async function DELETE(_req, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const editionId = Number(id);

    const existing = await prisma.editionPdf.findUnique({ where: { editionId } });
    if (!existing) {
      return NextResponse.json({ error: "No existe PDF para esta edición" }, { status: 404 });
    }

    await deleteFile(existing.pdfUrl);
    await prisma.editionPdf.delete({ where: { editionId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error DELETE edition pdf-abo:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

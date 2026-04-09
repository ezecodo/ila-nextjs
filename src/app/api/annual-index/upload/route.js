import { NextResponse } from "next/server";
import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/localUpload";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file    = formData.get("file");
    const year    = parseInt(formData.get("year"));
    const title   = formData.get("title")   || null;
    const titleES = formData.get("titleES") || null;

    if (!file || !file.type.includes("pdf")) {
      return NextResponse.json({ error: "Archivo PDF inválido" }, { status: 400 });
    }

    const existing = await prisma.annualIndex.findUnique({ where: { year } });
    if (existing) {
      return NextResponse.json({ error: `Ya existe el año ${year}` }, { status: 409 });
    }

    const downloadFileName = `ila_register_${year}.pdf`;
    const { url: fileUrl } = await uploadFile(file, "pdfs-public/annual-index", `ila_register_${year}`);

    const registro = await prisma.annualIndex.create({
      data: {
        year,
        title,
        titleES,
        fileUrl,
        fileName: downloadFileName,
        fileSize: file.size,
        uploadedBy: session.user.email,
      },
    });

    return NextResponse.json({ success: true, registro });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

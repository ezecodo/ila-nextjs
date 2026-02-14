import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { auth } from "@/app/auth"; // ✅
import { prisma } from "@/lib/prisma";

export async function DELETE(req, { params }) {
  try {
    // 🔒 Verificar autenticación
    const session = await auth(); // ← Cambiado
    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = params;

    // Buscar el registro
    const registro = await prisma.annualIndex.findUnique({
      where: { id },
    });

    if (!registro) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 },
      );
    }

    // Eliminar archivo físico del servidor
    const filePath = path.join(process.cwd(), "public", registro.fileUrl);
    try {
      await unlink(filePath);
      console.log(`🗑️ Archivo eliminado: ${registro.fileName}`);
    } catch (err) {
      console.warn(`⚠️ No se pudo eliminar archivo: ${err.message}`);
    }

    // Eliminar de BD
    await prisma.annualIndex.delete({
      where: { id },
    });

    console.log(`✅ Annual Index ${registro.year} eliminado`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error eliminando registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";

// POST - Subir CSV con emails
export async function POST(request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { message: "No se recibió ningún archivo" },
        { status: 400 },
      );
    }

    // Leer contenido del CSV
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    // Extraer emails (asumiendo una columna con emails)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = [];

    for (const line of lines) {
      const found = line.match(emailRegex);
      if (found) {
        emails.push(...found.map((e) => e.toLowerCase()));
      }
    }

    // Eliminar duplicados
    const uniqueEmails = [...new Set(emails)];

    // Obtener emails que ya existen
    const existingInvitations = await prisma.pdfAboInvitation.findMany({
      where: {
        email: { in: uniqueEmails },
      },
      select: { email: true },
    });

    const existingEmails = new Set(existingInvitations.map((i) => i.email));

    // Filtrar solo los nuevos
    const newEmails = uniqueEmails.filter((e) => !existingEmails.has(e));

    // Crear invitaciones en batch
    if (newEmails.length > 0) {
      await prisma.pdfAboInvitation.createMany({
        data: newEmails.map((email) => ({
          email,
          startDate: new Date(),
        })),
      });
    }

    return NextResponse.json({
      message: "CSV procesado",
      total: uniqueEmails.length,
      added: newEmails.length,
      duplicates: existingEmails.size,
    });
  } catch (error) {
    console.error("Error al procesar CSV:", error);
    return NextResponse.json(
      { message: "Error al procesar el archivo CSV" },
      { status: 500 },
    );
  }
}

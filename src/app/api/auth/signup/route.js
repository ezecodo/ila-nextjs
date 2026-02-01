import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { signUpSchema } from "@/lib/zod";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, name, pdfAbo } = signUpSchema.parse(body);

    // ✅ Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 },
      );
    }

    // ✅ Si viene de invitación PDF ABO, verificar que el email tenga invitación
    let pdfAboInvitation = null;
    if (pdfAbo) {
      pdfAboInvitation = await prisma.pdfAboInvitation.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!pdfAboInvitation) {
        return NextResponse.json(
          {
            error:
              "Este email no tiene una invitación PDF ABO. Usa el email donde recibiste la invitación.",
          },
          { status: 400 },
        );
      }

      if (pdfAboInvitation.isRedeemed) {
        return NextResponse.json(
          { error: "Esta invitación ya fue utilizada." },
          { status: 400 },
        );
      }
    }

    // ✅ Hashear la contraseña antes de guardarla
    const hashedPassword = await hash(password, 10);

    // ✅ Crear usuario (pero no verificado aún)
    const newUser = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    // ✅ Si es PDF ABO, marcar la invitación como canjeada
    if (pdfAboInvitation) {
      await prisma.pdfAboInvitation.update({
        where: { id: pdfAboInvitation.id },
        data: {
          isRedeemed: true,
          redeemedAt: new Date(),
          redeemedBy: newUser.id,
        },
      });
    }

    // ✅ Generar un token de verificación
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira en 24h

    // ✅ Guardar el token en `VerificationToken`
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expiresAt,
      },
    });

    // ✅ Enviar email con el token de verificación
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: "Registro exitoso. Verifica tu email para activar tu cuenta.",
        pdfAboActivated: !!pdfAboInvitation,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("❌ Error en el registro:", err);
    return NextResponse.json(
      { error: "Error en el registro" },
      { status: 500 },
    );
  }
}

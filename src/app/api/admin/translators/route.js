import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import { sendTranslatorInvitationEmail } from "@/lib/email";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Email inválido." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    // Caso 1: ya existe un usuario con ese email
    if (existing) {
      if (existing.role === "translator") {
        return NextResponse.json(
          { message: "Ese email ya es traductor/a." },
          { status: 409 }
        );
      }
      if (existing.role !== "user") {
        return NextResponse.json(
          {
            message: `Ese email pertenece a un ${existing.role} y no se puede convertir automáticamente.`,
          },
          { status: 409 }
        );
      }
      // Promover usuario normal a traductor (no se envía invitación: ya tiene cuenta)
      const promoted = await prisma.user.update({
        where: { id: existing.id },
        data: { role: "translator" },
        select: { id: true, name: true, email: true, role: true },
      });
      return NextResponse.json(
        { user: promoted, promoted: true },
        { status: 200 }
      );
    }

    // Caso 2: usuario nuevo → crear con contraseña aleatoria inutilizable
    const randomPassword = await hash(
      crypto.randomBytes(32).toString("hex"),
      10
    );

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role: "translator",
        password: randomPassword,
        emailVerified: null,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Token de invitación (reusa el mecanismo de reset de contraseña)
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + INVITE_TTL_MS),
      },
    });

    await sendTranslatorInvitationEmail(email, name, token);

    return NextResponse.json(
      { user: newUser, invited: true },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/admin/translators error:", err);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { signUpSchema } from "@/lib/zod";

export async function POST(req) {
  try {
    const body = await req.json();

    // ✅ Validar los datos con Zod
    const { email, password, name } = signUpSchema.parse(body);

    // ✅ Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    // ✅ Hashear la contraseña antes de guardarla
    const hashedPassword = await hash(password, 10);

    // ✅ Guardar el usuario en la base de datos
    const newUser = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    return NextResponse.json(
      { message: "Usuario registrado con éxito", user: newUser },
      { status: 201 }
    );
  } catch (err) {
    console.error("❌ Error en el registro:", err);
    return NextResponse.json(
      { error: "Error en el registro" },
      { status: 500 }
    );
  }
}

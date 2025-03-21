"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import cloudinary from "cloudinary";

// 🔹 Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Obtener todos los eventos (GET)
// 🔹 Obtener todos los eventos (GET)
export async function GET(req) {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
    });

    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

    if (isAdmin) {
      return NextResponse.json({
        items: events,
        totalPages: 1,
      });
    } else {
      return NextResponse.json(events); // el frontend necesita un array
    }
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

// 🔹 Crear un nuevo evento (POST) con subida a Cloudinary
export async function POST(req) {
  try {
    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const date = formData.get("date");
    const location = formData.get("location");
    const file = formData.get("image"); // Obtener archivo de la imagen

    if (!title || !description || !date || !location || !file) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // 🔹 Subir la imagen a Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream({ folder: "ila-events" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    if (!uploadResponse || !uploadResponse.secure_url) {
      return NextResponse.json(
        { error: "Error al subir la imagen" },
        { status: 500 }
      );
    }

    // 🔹 Guardar el evento en la base de datos con la URL de la imagen subida
    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        image: uploadResponse.secure_url, // Guardamos la URL de Cloudinary
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error al agregar evento:", error);
    return NextResponse.json(
      { error: "Error al agregar evento" },
      { status: 500 }
    );
  }
}

"use server";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/localUpload";

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
      return NextResponse.json(events);
    }
  } catch (error) {
    console.error("Error al obtener eventos:", error);
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}

// 📌 POST: crear nuevo evento
export async function POST(req) {
  try {
    const formData = await req.formData();
    const title       = formData.get("title");
    const titleES     = formData.get("titleES");
    const description = formData.get("description");
    const descriptionES = formData.get("descriptionES");
    const date        = formData.get("date");
    const time        = formData.get("time");
    const location    = formData.get("location");
    const file        = formData.get("image");

    if (!title || !description || !date || !location || !file) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const { url: imageUrl } = await uploadFile(file, "images/events");

    const newEvent = await prisma.event.create({
      data: {
        title,
        titleES,
        description,
        descriptionES,
        date: new Date(date),
        time,
        location,
        image: imageUrl,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: formData.get("userId"),
        action: "CREATE_EVENT",
        metadata: JSON.stringify({
          title:     newEvent.title,
          date:      newEvent.date,
          eventId:   newEvent.id,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear evento:", error);
    return NextResponse.json(
      { error: "Error al crear evento" },
      { status: 500 }
    );
  }
}

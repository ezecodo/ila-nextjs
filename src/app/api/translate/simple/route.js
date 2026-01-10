import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEEPL_API_BASE = process.env.DEEPL_API_BASE || "https://api.deepl.com/v2";
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

async function translateText(text) {
  if (!text) return "";
  const res = await fetch(`${DEEPL_API_BASE}/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      text,
      target_lang: "ES",
      source_lang: "DE",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepL error: ${errText}`);
  }
  const data = await res.json();
  return data.translations?.[0]?.text || "";
}

export async function POST(req) {
  try {
    const { text, type, id } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Texto requerido" }, { status: 400 });
    }

    const translated = await translateText(text);

    if (!translated) {
      return NextResponse.json(
        { error: "Error en la traducción" },
        { status: 500 }
      );
    }

    // Si se proporciona type e id, guardar directamente en la base de datos
    if (type && id) {
      const numericId = parseInt(id, 10);

      if (type === "topic") {
        await prisma.topic.update({
          where: { id: numericId },
          data: { nameES: translated },
        });
      } else if (type === "region") {
        await prisma.region.update({
          where: { id: numericId },
          data: { nameES: translated },
        });
      }
    }

    return NextResponse.json({ translated });
  } catch (err) {
    console.error("❌ Error traduciendo:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

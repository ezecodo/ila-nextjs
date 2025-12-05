// app/api/translate/deepl/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { articleId } = await req.json();
    if (!articleId) {
      return NextResponse.json(
        { error: "articleId requerido" },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: parseInt(articleId) },

      select: {
        id: true,
        title: true,
        subtitle: true,
        previewText: true,
        content: true,
        additionalInfo: true,
        beitragsId: true,
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Artículo no encontrado" },
        { status: 404 }
      );
    }
    // 🖼️ Obtener imágenes del artículo
    const contentIdToUse = article.beitragsId || article.id;
    const images = await prisma.image.findMany({
      where: {
        contentType: "ARTICLE",
        contentId: contentIdToUse,
      },
      select: {
        id: true,
        title: true,
        alt: true,
      },
    });
    const DEEPL_API_BASE =
      process.env.DEEPL_API_BASE || "https://api.deepl.com/v2";
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

    const translations = {
      titleES: await translateText(article.title),
      subtitleES: await translateText(article.subtitle),
      previewTextES: await translateText(article.previewText),
      contentES: await translateText(article.content),
      additionalInfoES: await translateText(article.additionalInfo),
    };
    // 🖼️ Traducir imágenes
    const imageTranslations = {};
    for (const img of images) {
      imageTranslations[img.id] = {
        titleES: await translateText(img.title),
        altES: await translateText(img.alt),
      };
    }
    return NextResponse.json({ translations, imageTranslations });
  } catch (err) {
    console.error("DeepL API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

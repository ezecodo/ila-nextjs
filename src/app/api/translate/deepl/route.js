// app/api/translate/deepl/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { articleId } = await req.json();
    if (!articleId) {
      return NextResponse.json(
        { error: "articleId requerido" },
        { status: 400 },
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
        { status: 404 },
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
    // 🔥 NUEVA FUNCIÓN: Dividir texto largo en chunks
    function splitIntoChunks(text, maxChars = 50000) {
      // ← 50k es más seguro
      if (!text || text.length <= maxChars) {
        return [text];
      }

      const chunks = [];
      let remainingText = text;

      while (remainingText.length > 0) {
        if (remainingText.length <= maxChars) {
          chunks.push(remainingText);
          break;
        }

        let cutPoint = remainingText.lastIndexOf("\n", maxChars);

        if (cutPoint === -1 || cutPoint < maxChars * 0.5) {
          cutPoint = remainingText.lastIndexOf(" ", maxChars);
        }

        if (cutPoint === -1 || cutPoint < maxChars * 0.5) {
          cutPoint = maxChars;
        }

        chunks.push(remainingText.substring(0, cutPoint));
        remainingText = remainingText.substring(cutPoint).trim();
      }

      console.log("📊 Chunks creados:");
      chunks.forEach((chunk, i) => {
        console.log(`   Chunk ${i + 1}: ${chunk.length} caracteres`);
      });

      return chunks;
    }

    async function callDeepl(text, isHtml) {
      const params = {
        text,
        target_lang: "ES",
        source_lang: "DE",
      };
      if (isHtml) {
        // tag_handling=html: DeepL translates text inside tags (incl. <a>)
        // while preserving all tag attributes (href, class, etc.)
        params.tag_handling = "html";
        params.ignore_tags = "img";
      }
      const res = await fetch(`${DEEPL_API_BASE}/translate`, {
        method: "POST",
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`DeepL error: ${errText}`);
      }
      const data = await res.json();
      return data.translations?.[0]?.text || "";
    }

    async function translateText(text, isHtml = false) {
      if (!text) return "";

      const chunks = splitIntoChunks(text, 50000);

      if (chunks.length === 1) {
        return await callDeepl(text, isHtml);
      }

      // Texto largo: traducir por chunks
      console.log(`📏 Texto largo: ${text.length} chars. Dividiendo en ${chunks.length} chunks...`);
      const translatedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Traduciendo chunk ${i + 1}/${chunks.length}...`);
        translatedChunks.push(await callDeepl(chunks[i], isHtml));
      }

      console.log(`✅ Traducción completada`);
      return translatedChunks.join("\n");
    }

    const translations = {
      titleES: await translateText(article.title),
      subtitleES: await translateText(article.subtitle, true),
      previewTextES: await translateText(article.previewText, true),
      contentES: await translateText(article.content, true),
      additionalInfoES: await translateText(article.additionalInfo, true),
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

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

    // Extrae <a>...</a> y los reemplaza con placeholders atómicos que DeepL no toca
    function extractLinks(html) {
      const links = [];
      const processed = html.replace(/<a[\s\S]*?<\/a>/gi, (match) => {
        const idx = links.length;
        links.push(match);
        return `<x id="lnk${idx}"/>`;
      });
      return { processed, links };
    }

    function restoreLinks(html, links) {
      if (!links.length) return html;
      return html.replace(/<x id="lnk(\d+)"\s*\/?>/gi, (_, i) => links[parseInt(i)] || "");
    }

    async function callDeepl(text, isHtml) {
      const params = {
        text,
        target_lang: "ES",
        source_lang: "DE",
      };
      if (isHtml) {
        params.tag_handling = "html";
        params.ignore_tags = "img,x";
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

      // Para HTML: proteger links antes de enviar a DeepL
      let links = [];
      let textToTranslate = text;
      if (isHtml) {
        const extracted = extractLinks(text);
        textToTranslate = extracted.processed;
        links = extracted.links;
      }

      const chunks = splitIntoChunks(textToTranslate, 50000);

      if (chunks.length === 1) {
        const translated = await callDeepl(textToTranslate, isHtml);
        return restoreLinks(translated, links);
      }

      // Texto largo: traducir por chunks y restaurar links al final
      console.log(`📏 Texto largo: ${textToTranslate.length} chars. Dividiendo en ${chunks.length} chunks...`);
      const translatedChunks = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`🔄 Traduciendo chunk ${i + 1}/${chunks.length}...`);
        const translated = await callDeepl(chunks[i], isHtml);
        translatedChunks.push(translated);
      }

      console.log(`✅ Traducción completada`);
      return restoreLinks(translatedChunks.join("\n"), links);
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

// app/api/translate/text/route.js
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/apiAuth";

export async function POST(req) {
  const denied = await requireRole(["admin", "translator", "reviewer"]);
  if (denied) return denied;
  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    const DEEPL_API_BASE =
      process.env.DEEPL_API_BASE || "https://api.deepl.com/v2";
    const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

    const res = await fetch(`${DEEPL_API_BASE}/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text,
        target_lang: targetLang,
        ...(sourceLang ? { source_lang: sourceLang } : {}),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`DeepL error: ${errText}`);
    }

    const data = await res.json();
    const translation = data.translations?.[0]?.text || "";

    return NextResponse.json({ translation });
  } catch (err) {
    console.error("DeepL text API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

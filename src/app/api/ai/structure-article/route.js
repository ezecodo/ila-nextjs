import { NextResponse } from "next/server";

// La extracción de texto del PDF puede ser larga → más margen que el default.
export const maxDuration = 60;

// Precios por millón de tokens (USD). Tarifas públicas de Anthropic; ajustar
// aquí si cambian. El coste se calcula en el server y se devuelve al cliente.
const PRICING = {
  "claude-haiku-4-5-20251001": { in: 1.0, out: 5.0 },
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
};
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `Du strukturierst Rohtext aus einem eingescannten Dossier der Zeitschrift "ila" (Informationsstelle Lateinamerika), Sprache Deutsch.
Der Text stammt aus PDF-Extraktion: Silbentrennung am Zeilenende, Spaltenumbrüche und Bildunterschriften können enthalten sein.
Deine Aufgabe: den Artikel in Felder zerlegen. Regeln:
- Nichts erfinden, nichts übersetzen, nichts kürzen. Der vollständige Fließtext muss erhalten bleiben.
- Silbentrennung am Zeilenende auflösen ("Wort-\nteil" -> "Wortteil").
- Absätze durch eine Leerzeile trennen.
- Zwischentitel (kurze Überschriften im Text) mit "## " am Zeilenanfang markieren.
- Die Autorenzeile ("von …", "Text: …", "Interview: …") gehört NICHT in den Fließtext, sondern in das Feld author.
- Titel, Untertitel und Vorspann (Lead/Intro vor dem ersten Absatz), wenn vorhanden, in ihre Felder; sonst leer lassen.
- Bildunterschriften und reine Seitenzahlen weglassen.
- Wenn ein Titel vorgegeben ist: NUR diesen Artikel extrahieren. Der Seitenbereich kann das Ende des vorherigen und/oder den Anfang des nächsten Artikels enthalten — diese Teile weglassen, sobald der Titel oder die Autorenzeile eines anderen Artikels beginnt.
- In boundaryNote kurz vermerken, wo abgeschnitten wurde (z. B. "abgeschnitten vor: «Titel des nächsten Artikels»"); leer lassen, wenn der gesamte Text zum Artikel gehört.`;

const TOOL = {
  name: "structure_article",
  description: "Den strukturierten Artikel in den Feldern zurückgeben.",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Artikeltitel" },
      subtitle: { type: "string", description: "Untertitel, sonst leerer String" },
      previewText: {
        type: "string",
        description: "Vorspann/Lead vor dem ersten Absatz, sonst leerer String",
      },
      author: {
        type: "string",
        description: "Name der Autor:in (ohne 'von'), sonst leerer String",
      },
      body: {
        type: "string",
        description:
          "Vollständiger Fließtext. Absätze durch eine Leerzeile getrennt, Zwischentitel mit '## ' am Zeilenanfang.",
      },
      boundaryNote: {
        type: "string",
        description:
          "Kurzer Hinweis, wo abgeschnitten wurde (Anfang des nächsten Artikels), sonst leerer String.",
      },
    },
    required: ["title", "body"],
  },
};

export async function POST(request) {
  try {
    const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY fehlt in .env.local" },
        { status: 500 }
      );
    }

    const { text, model, title } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Kein Text übergeben." }, { status: 400 });
    }
    const useModel = PRICING[model] ? model : DEFAULT_MODEL;

    const titleHint = (title || "").trim();
    const userContent = titleHint
      ? `Der zu extrahierende Artikel trägt den Titel: "${titleHint}".
Der folgende Rohtext stammt aus dem gewählten Seitenbereich und kann das Ende des vorherigen und/oder den Anfang des nächsten Artikels enthalten. Extrahiere AUSSCHLIESSLICH den Artikel mit diesem Titel.

---
${text}`
      : text;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: useModel,
        max_tokens: 16000,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "structure_article" },
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("❌ Anthropic error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "Anthropic API Fehler" },
        { status: 502 }
      );
    }

    const toolUse = (data.content || []).find((c) => c.type === "tool_use");
    if (!toolUse) {
      return NextResponse.json(
        { error: "Keine strukturierte Antwort erhalten." },
        { status: 502 }
      );
    }

    const out = toolUse.input || {};
    const usage = data.usage || {};
    const inTok = usage.input_tokens || 0;
    const outTok = usage.output_tokens || 0;
    const price = PRICING[useModel] || PRICING[DEFAULT_MODEL];
    const cost = (inTok / 1e6) * price.in + (outTok / 1e6) * price.out;

    return NextResponse.json({
      title: out.title || "",
      subtitle: out.subtitle || "",
      previewText: out.previewText || "",
      author: out.author || "",
      body: out.body || "",
      boundaryNote: out.boundaryNote || "",
      model: useModel,
      usage: { input_tokens: inTok, output_tokens: outTok },
      cost,
    });
  } catch (error) {
    console.error("❌ structure-article error:", error);
    return NextResponse.json(
      { error: error.message || "Interner Fehler" },
      { status: 500 }
    );
  }
}

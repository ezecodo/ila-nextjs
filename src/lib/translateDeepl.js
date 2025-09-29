// src/lib/translateDeepl.js

/**
 * Traduce texto usando tu endpoint interno de DeepL
 * @param {string} text - Texto a traducir
 * @param {string} sourceLang - Idioma de origen (ej: "DE")
 * @param {string} targetLang - Idioma destino (ej: "ES")
 * @returns {Promise<string>} Texto traducido
 */
export async function translateWithDeepl(text, sourceLang, targetLang) {
  if (!text) return "";
  try {
    const res = await fetch("/api/translate/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sourceLang, targetLang }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Error en la traducción");
    }

    return data.translation || "";
  } catch (e) {
    console.error("DeepL helper error:", e);
    return "";
  }
}

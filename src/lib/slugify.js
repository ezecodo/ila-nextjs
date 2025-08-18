// lib/slugify.js

// Mapa manual para casos que NO deben perderse al normalizar
const SPECIAL_MAP = {
  // Alemán
  Ä: "Ae",
  Ö: "Oe",
  Ü: "Ue",
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  // Español/otros (preferimos ASCII)
  ñ: "n",
  Ñ: "N",
  á: "a",
  Á: "A",
  é: "e",
  É: "E",
  í: "i",
  Í: "I",
  ó: "o",
  Ó: "O",
  ú: "u",
  Ú: "U",
  ç: "c",
  Ç: "C",
};

function applySpecialMap(str) {
  return str.replace(/[\u00C0-\u017F]/g, (ch) => SPECIAL_MAP[ch] ?? ch);
}

/**
 * slugify("Grünes Gold & Weißes Gold – Schokolade!")
 * -> "gruenes-gold-and-weisses-gold-schokolade"
 */
export default function slugify(input, maxLen = 80) {
  if (!input || typeof input !== "string") return "";

  // 1) Trim
  let s = input.trim();

  // 2) Aplicar transliteración específica (ä→ae, ß→ss, etc.)
  s = applySpecialMap(s);

  // 3) Normalizar y quitar diacríticos restantes (combining marks)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 4) Reemplazos semánticos suaves
  s = s.replace(/&/g, " and "); // neutral, evita '&'
  s = s.replace(/[@]/g, " at "); // por si aparece

  // 5) Cualquier cosa que no sea [a-z0-9] -> guion
  s = s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // 6) Colapsar guiones múltiples y recortar a los costados
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");

  // 7) Longitud máxima (opcional)
  if (maxLen && s.length > maxLen) {
    s = s.slice(0, maxLen).replace(/-+$/g, "");
  }

  return s;
}

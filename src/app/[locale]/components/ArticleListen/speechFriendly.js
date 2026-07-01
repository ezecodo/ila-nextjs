// Ajusta SOLO el texto que se habla (no el del DOM). Los offsets del resaltado
// se calculan sobre el texto original (ver `start` → `tts.play(blocks, fn)`),
// así que estas sustituciones pueden cambiar el largo sin desalinear nada.
//  - "ila"/"ILA" → "Ila": evita que se deletree i-l-a como sigla.
//  - "y" suelta (alemán) → "i": nombres propios en español ("El perro y el
//    gato") se leen "ee" en vez de "Ypsilon".
//  - "1. Oktober" (alemán) → "erste Oktober": la voz lee el número como
//    cardinal ("eins"); para fechas con mes lo pasamos a ordinal.
const DE_ORDINALS = {
  1: "erste", 2: "zweite", 3: "dritte", 4: "vierte", 5: "fünfte",
  6: "sechste", 7: "siebte", 8: "achte", 9: "neunte", 10: "zehnte",
  11: "elfte", 12: "zwölfte", 13: "dreizehnte", 14: "vierzehnte",
  15: "fünfzehnte", 16: "sechzehnte", 17: "siebzehnte", 18: "achtzehnte",
  19: "neunzehnte", 20: "zwanzigste", 21: "einundzwanzigste",
  22: "zweiundzwanzigste", 23: "dreiundzwanzigste", 24: "vierundzwanzigste",
  25: "fünfundzwanzigste", 26: "sechsundzwanzigste", 27: "siebenundzwanzigste",
  28: "achtundzwanzigste", 29: "neunundzwanzigste", 30: "dreißigste",
  31: "einunddreißigste",
};
const DE_MONTHS =
  "Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember";
const DE_DATE_RE = new RegExp(`\\b(\\d{1,2})\\.\\s+(${DE_MONTHS})\\b`, "g");

export function speechFriendly(text, lang) {
  if (!text) return text;
  let out = text.replace(/\bila\b/gi, "Ila");
  if (lang === "de") {
    out = out.replace(/\by\b/g, "i");
    out = out.replace(DE_DATE_RE, (m, d, month) => {
      const ord = DE_ORDINALS[parseInt(d, 10)];
      return ord ? `${ord} ${month}` : m;
    });
    // Lenguaje inclusivo: Gendersternchen / Doppelpunkt / Gender-Gap
    // ("Migrant*innen", "Kolleg:innen", "Mitarbeiter_innen"). La voz lee el
    // símbolo ("Stern"…). Al reemplazarlo por un espacio, el motor pronuncia
    // el sufijo (vocal inicial) con su golpe de glotis → la pausa de género
    // correcta. Exige letra antes y minúscula inmediatamente después, así no
    // toca horas ("14:30") ni URLs ("http://").
    out = out.replace(/(\p{L})[*:_](?=\p{Ll})/gu, "$1 ");
  }
  return out;
}

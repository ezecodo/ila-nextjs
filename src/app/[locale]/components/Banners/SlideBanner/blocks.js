// Registro compartido de bloques del banner por bloques (tipo "custom" del modelo Banner).
// Un banner = { align: "left"|"center"|"right", items: [ {type, ...campos}, ... ] } guardado
// en el campo Json `blocks`. Este archivo es la única fuente de verdad de qué tipos de bloque
// existen y sus campos — lo usan tanto el editor (/dashboard/banners) como el renderer
// público (BannerSlide.jsx), para que agregar un tipo de bloque nuevo sea un solo lugar
// para tocar.
//
// Layout: flujo automático (flexbox wrap), no posiciones ni tamaños manuales — los bloques
// se acomodan solos uno al lado del otro y bajan de línea cuando no entran, así nunca se
// pisan entre sí y el resultado queda siempre simétrico respecto a `align`. El equipo solo
// controla el orden (↑↓ en el editor) y la alineación general del banner.

// Métricas del sitio disponibles para el bloque "stats" (ver /api/stats/site)
export const STAT_REGISTRY = {
  articles: { de: "Beiträge", es: "Artículos" },
  editions: { de: "Dossiers", es: "Dossiers" },
  translatedEs: { de: "Auf Spanisch", es: "En español" },
  authors: { de: "Autor*innen", es: "Autorías" },
  regions: { de: "Regionen", es: "Regiones" },
  topics: { de: "Themen", es: "Temas" },
  yearsActive: { de: "Jahre Geschichte", es: "Años de historia" },
};

export const STAT_KEYS = Object.keys(STAT_REGISTRY);

export const DEFAULT_ALIGN = "center";
export const ALIGN_OPTIONS = [
  { value: "left", label: "⬅ Izquierda" },
  { value: "center", label: "⬛ Centro" },
  { value: "right", label: "➡ Derecha" },
];

// Tamaño de fuente/ícono del bloque — independiente del layout (que sigue siendo flujo
// automático). No es "cuánto espacio ocupa" sino "qué tan grande se ve" su contenido.
export const DEFAULT_SIZE = "md";
export const SIZE_OPTIONS = [
  { value: "sm", label: "Chico" },
  { value: "md", label: "Mediano" },
  { value: "lg", label: "Grande" },
];

// Estética del kicker del bloque "texto libre": "plain" (texto chico gris/blanco, el look
// de siempre) o "chip" — caja tipo badge, misma idea que el encabezado "chip" de las
// secciones de columna (VERANSTALTUNGEN/AKTUELLES, ver QuietSectionHeader.tsx) pero en
// blanco translúcido en vez de rojo sólido, para que se vea bien sin importar el color de
// fondo que tenga el banner (un chip rojo se perdería en un banner que ya es rojo).
export const DEFAULT_KICKER_STYLE = "plain";
export const KICKER_STYLE_OPTIONS = [
  { value: "plain", label: "Texto simple" },
  { value: "chip", label: "Chip (como los encabezados de sección)" },
];

// Cuánto texto del cuerpo se muestra en el bloque "texto libre" antes de recortar con "…".
// Distinto de `size` (que es tamaño de fuente): esto controla cuánto ESPACIO VERTICAL ocupa
// el bloque dentro del banner — un texto largo puede comerse el lugar de los bloques que
// vengan después (el flujo automático los empuja o los recorta, ver overflow-hidden fijo).
export const DEFAULT_BODY_LINES = 3;
export const BODY_LINES_OPTIONS = [
  { value: 2, label: "Corto (2 líneas)" },
  { value: 3, label: "Medio (3 líneas)" },
  { value: 5, label: "Largo (5 líneas)" },
  { value: 0, label: "Todo el texto" },
];

// Definición de cada tipo de bloque: label para el picker del admin + fábrica de bloque nuevo
export const BLOCK_DEFS = {
  logo: {
    label: "🏷️ Logo ila",
    create: () => ({ type: "logo", size: DEFAULT_SIZE }), // sin más config — solo el wordmark, sin el "50" (no es time-bound)
  },
  stats: {
    label: "📊 Stats del archivo",
    create: () => ({ type: "stats", keys: ["articles", "editions"], size: DEFAULT_SIZE }),
  },
  text: {
    label: "📝 Texto libre",
    create: () => ({
      type: "text",
      kickerDe: "",
      kickerEs: "",
      kickerStyle: DEFAULT_KICKER_STYLE,
      titleDe: "",
      titleEs: "",
      bodyDe: "",
      bodyEs: "",
      size: DEFAULT_SIZE,
      bodyLines: DEFAULT_BODY_LINES,
    }),
  },
  cta: {
    label: "🔘 Botón (CTA)",
    create: () => ({ type: "cta", labelDe: "", labelEs: "", url: "", size: DEFAULT_SIZE }),
  },
  eventDate: {
    label: "📅 Fecha de evento",
    create: () => ({ type: "eventDate", date: "", size: DEFAULT_SIZE }),
  },
  digiAbo: {
    label: "🌎 Promo Digital-Abo",
    create: () => ({ type: "digiAbo", pitchDe: "", pitchEs: "", size: DEFAULT_SIZE }),
  },
};

export const DIGIABO_DEFAULT_PITCH = {
  de: "Archiv, Hörfunktion und interaktiver Globus — das Digital-Abo.",
  es: "Archivo completo, audio y globo interactivo — el Digital-Abo.",
};

// Acepta la forma actual ({ align, items }) y, por compatibilidad hacia atrás, la forma
// vieja (un array plano de bloques, de antes de que existiera `align`) — así los banners
// ya guardados en la base (incluidos los de las vueltas anteriores de este mismo feature,
// con campos `pos`/`span` sueltos en cada bloque que ya no se usan) siguen renderizando,
// simplemente ignorando esos campos de más.
export function normalizeBlocks(raw) {
  if (Array.isArray(raw)) return { align: DEFAULT_ALIGN, items: raw };
  if (raw && Array.isArray(raw.items)) {
    return { align: raw.align || DEFAULT_ALIGN, items: raw.items };
  }
  return { align: DEFAULT_ALIGN, items: [] };
}

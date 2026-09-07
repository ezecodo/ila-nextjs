"use client";

// Presentacional puro: recibe un banner (fila de la tabla Banner, type "custom") + las
// stats del sitio ya resueltas, y dibuja sus bloques. Sin fetch propio — así el mismo
// componente sirve para el slide público (SlideBanner.jsx) y la vista previa del dashboard,
// sin duplicar el render en dos lugares (ver gotcha de las 4 copias de
// wrapInlineImagesWithCaption en CLAUDE.md — acá lo evitamos desde el arranque).
//
// Tamaño SIEMPRE fijo (BANNER_HEIGHT + overflow-hidden): con banners armados a mano desde
// el dashboard, el contenido puede no entrar — se recorta en vez de romper el layout del
// sidebar o desincronizar la altura de los slides del carrusel.
//
// Layout: flujo automático (flex-wrap), no posiciones ni tamaños manuales — los bloques se
// acomodan solos uno al lado del otro (como texto) y bajan de línea cuando no entran, así
// nunca se pisan entre sí. Lo único configurable es el orden (ver /dashboard/banners) y la
// alineación general (`banner.blocks.align`).
import Link from "next/link";
import { FaRegCalendarAlt } from "react-icons/fa";
import { DigiAboMark } from "../../../order/digital-abo/Wordmark";
import IlaLogo50 from "../../IlaLogo/ilaLogo50";
import { STAT_REGISTRY, DIGIABO_DEFAULT_PITCH, normalizeBlocks } from "./blocks";

export const BANNER_HEIGHT = 356;

const futura = { fontFamily: "Futura Cyrillic, Arial, sans-serif" };

const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" };

function bg(banner) {
  const from = banner.bgGradientFrom || "#BD0E0D";
  const to = banner.bgGradientTo || from;
  return from === to
    ? { backgroundColor: from }
    : { background: `linear-gradient(to bottom right, ${from}, ${to})` };
}

function pick(obj, deKey, esKey, locale) {
  return (locale === "es" && obj[esKey]) || obj[deKey] || "";
}

// Cada bloque respeta block.size ("sm"|"md"|"lg", default "md") de forma independiente del
// layout (que sigue siendo flujo automático) — solo cambia qué tan grande se ve.
function sizeClass(size, scale) {
  return scale[size] || scale.md;
}

const STAT_VALUE_SIZE = {
  sm: "text-lg md:text-xl",
  md: "text-2xl md:text-3xl",
  lg: "text-3xl md:text-4xl",
};
const STAT_LABEL_SIZE = {
  sm: "text-[9px] md:text-[10px]",
  md: "text-[10px] md:text-[11px]",
  lg: "text-[11px] md:text-xs",
};

function StatsBlock({ block, stats, locale }) {
  const keys = (block.keys || []).filter((k) => STAT_REGISTRY[k]);
  if (keys.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
      {keys.map((key) => (
        <div key={key} className="flex flex-col items-center">
          <span
            className={`${sizeClass(block.size, STAT_VALUE_SIZE)} font-extrabold leading-none`}
            style={futura}
          >
            {stats?.[key] ?? "…"}
          </span>
          <span
            className={`mt-1 ${sizeClass(block.size, STAT_LABEL_SIZE)} font-semibold uppercase tracking-wide text-white/80 text-center`}
          >
            {STAT_REGISTRY[key][locale === "es" ? "es" : "de"]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Un poco más grande que STAT_LABEL_SIZE (mismo espíritu tipográfico: bold,
// mayúsculas, tracking-wide) — pedido explícito: que el kicker "plain" se
// vea como el texto que describe los números de stats, pero más grande.
const KICKER_SIZE = {
  sm: "text-[11px] md:text-xs",
  md: "text-xs md:text-sm",
  lg: "text-sm md:text-base",
};

const TEXT_TITLE_SIZE = {
  sm: "text-base md:text-lg",
  md: "text-lg md:text-xl",
  lg: "text-2xl md:text-3xl",
};
const TEXT_BODY_SIZE = {
  sm: "text-[11px] md:text-xs",
  md: "text-xs md:text-sm",
  lg: "text-sm md:text-base",
};

// Cuánto texto se ve antes de recortar con "…" (ver DEFAULT_BODY_LINES/BODY_LINES_OPTIONS
// en blocks.js) — clases literales para que Tailwind las detecte (no armar el nombre a mano).
const LINE_CLAMP = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  5: "line-clamp-5",
  0: "",
};

function TextBlock({ block, locale }) {
  const kicker = pick(block, "kickerDe", "kickerEs", locale);
  const title = pick(block, "titleDe", "titleEs", locale);
  const body = pick(block, "bodyDe", "bodyEs", locale);
  if (!kicker && !title && !body) return null;
  const bodyClamp = LINE_CLAMP[block.bodyLines] ?? LINE_CLAMP[3];
  return (
    <div className="flex flex-col gap-1 max-w-[320px]">
      {kicker && (block.kickerStyle === "chip" ? (
        // Mismo espíritu que el chip de QuietSectionHeader (VERANSTALTUNGEN/
        // AKTUELLES) pero blanco translúcido en vez de rojo sólido — un chip
        // rojo se perdería en un banner que ya es rojo (ver blocks.js).
        <span
          className="self-start inline-block bg-white/15 border border-white/25 text-white text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5"
          style={futura}
        >
          {kicker}
        </span>
      ) : (
        // Misma familia tipográfica y peso que STAT_LABEL_SIZE (sans del
        // cuerpo, no Futura — acá no es un elemento de marca como el logo o
        // el título, es un rótulo descriptivo) — solo un poco más grande.
        <p
          className={`-mt-6 ${sizeClass(block.size, KICKER_SIZE)} font-semibold uppercase tracking-wide text-white/80`}
        >
          {kicker}
        </p>
      ))}
      {title && (
        <h3
          className={`${sizeClass(block.size, TEXT_TITLE_SIZE)} font-extrabold leading-tight tracking-tight line-clamp-2`}
          style={futura}
        >
          {title}
        </h3>
      )}
      {body && (
        <p className={`${sizeClass(block.size, TEXT_BODY_SIZE)} leading-snug text-white/90 ${bodyClamp}`}>
          {body}
        </p>
      )}
    </div>
  );
}

const CTA_SIZE = {
  sm: "px-3 py-1.5 text-[11px]",
  md: "px-4 py-2 text-xs md:text-sm",
  lg: "px-5 py-2.5 text-sm md:text-base",
};

function CtaBlock({ block, locale, accent }) {
  const label = pick(block, "labelDe", "labelEs", locale);
  if (!label || !block.url) return null;
  return (
    <Link
      href={block.url}
      className={`inline-flex items-center gap-2 rounded-none border-2 border-white bg-transparent font-bold text-white transition-all hover:bg-white ${sizeClass(block.size, CTA_SIZE)}`}
      onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
      onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
    >
      {label}
    </Link>
  );
}

function EventDateBlock({ block, locale, accent }) {
  if (!block.date) return null;
  const label = new Date(block.date).toLocaleDateString(
    locale === "es" ? "es-ES" : "de-DE",
    { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" },
  );
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-none bg-white font-bold shadow-sm ${sizeClass(block.size, CTA_SIZE)}`}
      style={{ color: accent }}
    >
      <FaRegCalendarAlt className="text-xs" /> {label}
    </div>
  );
}

const DIGIABO_MARK_SIZE = { sm: "default", md: "default", lg: "lg" };

function DigiAboBlock({ block, locale }) {
  const pitch =
    pick(block, "pitchDe", "pitchEs", locale) ||
    DIGIABO_DEFAULT_PITCH[locale === "es" ? "es" : "de"];
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-white/10 px-4 py-3 max-w-[280px]">
      <DigiAboMark size={DIGIABO_MARK_SIZE[block.size] || "default"} glow={false} />
      <p className={`${sizeClass(block.size, TEXT_BODY_SIZE)} text-white/90 leading-snug text-center line-clamp-2`}>
        {pitch}
      </p>
      <Link
        href="/order/digital-abo"
        className={`inline-flex items-center gap-1.5 rounded-none bg-[#89B881] font-bold text-white transition-transform hover:scale-105 ${sizeClass(block.size, CTA_SIZE)}`}
      >
        {locale === "es" ? "Saber más" : "Mehr erfahren"}
      </Link>
    </div>
  );
}

// "mini" (80px) queda afuera a propósito: es el preset pensado para navbar, no para un
// banner grande — con él el logo quedaba perdido en medio de mucho margen vacío. Antes
// además el fallback (bloque sin `size` guardado, el caso más común) caía justo en "mini"
// mientras el propio dropdown del editor mostraba "Mediano" seleccionado — desajuste entre
// lo que se veía elegido y lo que en realidad se renderizaba. Ahora el fallback es
// "default", coherente con el resto de los bloques (sizeClass() cae a la escala "md").
const LOGO_SIZE = { sm: "compact", md: "default", lg: "large" };

function LogoBlock({ block }) {
  // Sin el "50": es un mark decorativo del banner, no algo atado al aniversario.
  // w-full: el logo siempre ocupa la fila entera del flujo automático, así lo
  // que venga después (un kicker, un texto) siempre cae en una línea nueva,
  // debajo — nadie quiere algo apretado al costado del wordmark grande.
  return (
    <div className="w-full flex justify-center">
      <IlaLogo50
        size={LOGO_SIZE[block.size] || "default"}
        show50={false}
        isLink={false}
        animated={false}
      />
    </div>
  );
}

const BLOCK_RENDERERS = {
  logo: LogoBlock,
  stats: StatsBlock,
  text: TextBlock,
  cta: CtaBlock,
  eventDate: EventDateBlock,
  digiAbo: DigiAboBlock,
};

export default function BannerSlide({ banner, stats, locale }) {
  const accent = banner.bgGradientFrom || "#BD0E0D";
  const { align, items } = normalizeBlocks(banner.blocks);

  return (
    <div
      className="relative overflow-hidden text-white shadow-md -mx-2 sm:mx-0"
      style={{ ...bg(banner), height: BANNER_HEIGHT, flexShrink: 0 }}
    >
      {/* Textura + viñeta — para que un bloque de color sólido no quede tan plano */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.16) 100%)",
        }}
      />

      {/* Flujo automático: los bloques se acomodan solos uno al lado del otro y bajan de
          línea cuando no entran — nunca se pisan, sin coordenadas manuales. */}
      <div
        className="relative flex h-full flex-wrap content-center items-center gap-x-6 gap-y-4 overflow-hidden px-6 py-4 text-center"
        style={{ justifyContent: JUSTIFY[align] || "center", textAlign: align }}
      >
        {items.map((block, i) => {
          const Renderer = BLOCK_RENDERERS[block.type];
          if (!Renderer) return null;
          return (
            <Renderer key={i} block={block} stats={stats} locale={locale} accent={accent} />
          );
        })}
      </div>
    </div>
  );
}

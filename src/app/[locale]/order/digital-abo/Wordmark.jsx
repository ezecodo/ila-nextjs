"use client";

import { FaBookOpen, FaGlobeAmericas } from "react-icons/fa";

/**
 * Wordmark "botón" reutilizado del dashboard de admins (DashboardStats):
 * caja blanca, borde cyan con anillo pulsante + glow, texto en Futura
 * (parte izquierda gris, parte derecha en rojo de marca).
 */
const SIZES = {
  default: {
    box: "px-3 py-2 gap-1.5",
    text: "text-lg",
    prefix: "text-sm",
    icon: 16,
  },
  lg: {
    box: "px-6 py-4 gap-2.5",
    text: "text-3xl md:text-4xl",
    prefix: "text-base",
    icon: 30,
  },
};

// Paletas de acento (borde + anillo + glow + ícono). El ícono va un punto más
// oscuro que el borde (mismo patrón que el original cyan-400 / cyan-500).
const ACCENTS = {
  cyan: { edge: "#22d3ee", icon: "#06b6d4", glow: "rgba(34,211,238,0.8)" },
  green: { edge: "#89B881", icon: "#89B881", glow: "rgba(137,184,129,0.85)" },
};

function IlaButtonMark({
  Icon,
  left,
  right,
  prefix,
  glow = true,
  size = "default",
  className = "",
  accent = "cyan",
  rightColor = "#BD0E0D",
}) {
  const s = SIZES[size] || SIZES.default;
  const a = ACCENTS[accent] || ACCENTS.cyan;
  return (
    <span
      className={`relative inline-flex items-center ${s.box} rounded-md border-2 bg-white whitespace-nowrap ${className}`}
      style={{
        borderColor: a.edge,
        boxShadow: glow ? `0 0 16px 3px ${a.glow}` : undefined,
      }}
    >
      {glow && (
        <span
          className="pointer-events-none absolute inset-0 rounded-md animate-pulse"
          style={{ boxShadow: `inset 0 0 0 2px ${a.edge}` }}
        />
      )}
      {prefix && (
        <span className={`${s.prefix} font-bold leading-none text-gray-700`}>
          {prefix}
        </span>
      )}
      <Icon size={s.icon} style={{ color: a.icon }} />
      <span
        className={`${s.text} font-extrabold leading-none tracking-tight`}
        style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
      >
        <span className="text-gray-900">{left}</span>
        <span style={{ color: rightColor }}>{right}</span>
      </span>
    </span>
  );
}

export function DigiAboMark({ glow = true, prefix, size = "default", className = "" }) {
  return (
    <IlaButtonMark
      Icon={FaBookOpen}
      left="DIGI"
      right="abo"
      prefix={prefix}
      glow={glow}
      size={size}
      className={className}
      accent="green"
      rightColor="#89B881"
    />
  );
}

export function GlobIlaMark({ glow = true, prefix, size = "default", className = "" }) {
  return (
    <IlaButtonMark
      Icon={FaGlobeAmericas}
      left="GLOB"
      right="ila"
      prefix={prefix}
      glow={glow}
      size={size}
      className={className}
    />
  );
}

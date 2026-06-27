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

function IlaButtonMark({
  Icon,
  left,
  right,
  prefix,
  glow = true,
  size = "default",
  className = "",
}) {
  const s = SIZES[size] || SIZES.default;
  return (
    <span
      className={`relative inline-flex items-center ${s.box} rounded-md border-2 border-cyan-400 bg-white whitespace-nowrap ${
        glow ? "shadow-[0_0_16px_3px_rgba(34,211,238,0.8)]" : ""
      } ${className}`}
    >
      {glow && (
        <span className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-cyan-400 animate-pulse" />
      )}
      {prefix && (
        <span className={`${s.prefix} font-bold leading-none text-gray-700`}>
          {prefix}
        </span>
      )}
      <Icon size={s.icon} className="text-cyan-500" />
      <span
        className={`${s.text} font-extrabold leading-none tracking-tight`}
        style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
      >
        <span className="text-gray-900">{left}</span>
        <span className="text-[#BD0E0D]">{right}</span>
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

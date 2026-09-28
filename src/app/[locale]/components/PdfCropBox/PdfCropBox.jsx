"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Recuadro de recorte editable sobre una página de PDF (Artikel aus PDF,
// Artikel ohne Bild): se mueve arrastrando desde adentro, se redimensiona
// desde esquinas/bordes y se GIRA con la manija de arriba — para imágenes
// inclinadas en la maqueta. Confirmar (botón / Enter) llama a onConfirm;
// cancelar (✕ / Esc) a onCancel.
//
// `box` en px locales al canvas mostrado: { cx, cy, w, h, angle } (centro,
// tamaño, grados en sentido horario). El padre lo guarda en coords PDF y lo
// convierte, así un cambio de zoom no lo desalinea.

const MIN_SIZE = 12;
// Varias páginas pueden tener un recuadro abierto a la vez (Artikel aus PDF
// muestra el dossier entero): el teclado solo actúa sobre el último tocado.
let activeBoxToken = 0;

const rad = (deg) => (deg * Math.PI) / 180;
const rotate = (x, y, deg) => {
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return { x: x * c - y * s, y: x * s + y * c };
};
const normAngle = (a) => {
  let n = ((a + 180) % 360 + 360) % 360 - 180;
  if (Object.is(n, -0)) n = 0;
  return n;
};

// Manijas de tamaño: dirección en el marco local del recuadro.
const HANDLES = [
  { sx: -1, sy: -1, cursor: "nwse-resize" },
  { sx: 0, sy: -1, cursor: "ns-resize" },
  { sx: 1, sy: -1, cursor: "nesw-resize" },
  { sx: 1, sy: 0, cursor: "ew-resize" },
  { sx: 1, sy: 1, cursor: "nwse-resize" },
  { sx: 0, sy: 1, cursor: "ns-resize" },
  { sx: -1, sy: 1, cursor: "nesw-resize" },
  { sx: -1, sy: 0, cursor: "ew-resize" },
];

export default function PdfCropBox({ box, onChange, onConfirm, onCancel, busy }) {
  const t = useTranslations("cropBox");
  const rootRef = useRef(null);
  const tokenRef = useRef(0);
  const opRef = useRef(null); // operación de arrastre en curso
  const [rotating, setRotating] = useState(false);

  const activate = () => {
    activeBoxToken += 1;
    tokenRef.current = activeBoxToken;
  };

  // Recién creado = activo.
  useEffect(() => {
    activate();
  }, []);

  // Mantener refs frescas para el listener de teclado.
  const latest = useRef({ box, onChange, onConfirm, onCancel });
  latest.current = { box, onChange, onConfirm, onCancel };

  useEffect(() => {
    const onKey = (e) => {
      if (tokenRef.current !== activeBoxToken) return;
      const tag = e.target?.tagName;
      // BUTTON: Enter ya dispara su propio click (evita recortar dos veces).
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || e.target?.isContentEditable)
        return;
      const { box: b, onChange: change, onConfirm: confirm, onCancel: cancel } = latest.current;
      if (e.key === "Enter") {
        e.preventDefault();
        confirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      } else if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const step = e.shiftKey ? 0.1 : 1;
        change({ ...b, angle: normAngle(b.angle + (e.key === "]" ? step : -step)) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Punto del puntero en px locales al contenedor de la página (el padre
  // posicionado donde vive este recuadro).
  const localPoint = (e) => {
    const parent = rootRef.current?.parentElement;
    const r = parent.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startOp = (e, op) => {
    e.preventDefault();
    e.stopPropagation();
    activate();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    opRef.current = { ...op, start: localPoint(e), box0: { ...box } };
    if (op.type === "rotate") setRotating(true);
  };

  const onPointerMove = (e) => {
    const op = opRef.current;
    if (!op) return;
    const p = localPoint(e);
    const b0 = op.box0;
    if (op.type === "move") {
      onChange({ ...b0, cx: b0.cx + p.x - op.start.x, cy: b0.cy + p.y - op.start.y });
    } else if (op.type === "rotate") {
      // Manija arriba del recuadro: ángulo 0 = puntero justo encima del centro.
      let angle = (Math.atan2(p.y - b0.cy, p.x - b0.cx) * 180) / Math.PI + 90;
      angle = e.shiftKey ? Math.round(angle) : Math.round(angle * 10) / 10;
      onChange({ ...b0, angle: normAngle(angle) });
    } else if (op.type === "resize") {
      // Delta del puntero llevado al marco local (sin giro) del recuadro.
      const d = rotate(p.x - op.start.x, p.y - op.start.y, -b0.angle);
      const w = Math.max(MIN_SIZE, b0.w + op.sx * d.x);
      const h = Math.max(MIN_SIZE, b0.h + op.sy * d.y);
      // El lado opuesto queda fijo: el centro se corre la mitad de lo que
      // creció, en la dirección de la manija (vuelta al marco de la página).
      const shift = rotate((op.sx * (w - b0.w)) / 2, (op.sy * (h - b0.h)) / 2, b0.angle);
      onChange({ ...b0, w, h, cx: b0.cx + shift.x, cy: b0.cy + shift.y });
    }
  };

  const endOp = () => {
    opRef.current = null;
    setRotating(false);
  };

  const stop = (e) => e.stopPropagation();
  const handleProps = { onPointerMove, onPointerUp: endOp, onPointerCancel: endOp };

  return (
    <div
      ref={rootRef}
      // El padre (página) escucha mousedown para empezar un rectángulo nuevo:
      // dentro del recuadro no tiene que pasar.
      onMouseDown={stop}
      onMouseUp={stop}
      className="absolute z-30"
      style={{
        left: box.cx - box.w / 2,
        top: box.cy - box.h / 2,
        width: box.w,
        height: box.h,
        transform: `rotate(${box.angle}deg)`,
        transformOrigin: "center",
      }}
    >
      {/* Cuerpo: mover */}
      <div
        className="absolute inset-0 border-2 border-[#BD0E0D] bg-[#BD0E0D]/10 cursor-move touch-none"
        onPointerDown={(e) => startOp(e, { type: "move" })}
        {...handleProps}
      />

      {/* Manija de giro */}
      <div
        className="absolute left-1/2 -top-8 w-px h-6 bg-[#BD0E0D] pointer-events-none"
        aria-hidden="true"
      />
      <div
        role="slider"
        aria-label={t("rotate")}
        aria-valuenow={Math.round(box.angle * 10) / 10}
        aria-valuemin={-180}
        aria-valuemax={180}
        title={t("rotateHint")}
        className="absolute left-1/2 -top-11 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#BD0E0D] cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={(e) => startOp(e, { type: "rotate" })}
        {...handleProps}
      />

      {/* Manijas de tamaño */}
      {HANDLES.map((h) => (
        <div
          key={`${h.sx}${h.sy}`}
          className="absolute w-3 h-3 bg-white border-2 border-[#BD0E0D] touch-none"
          style={{
            left: `calc(${((h.sx + 1) / 2) * 100}% - 6px)`,
            top: `calc(${((h.sy + 1) / 2) * 100}% - 6px)`,
            cursor: h.cursor,
          }}
          onPointerDown={(e) => startOp(e, { type: "resize", sx: h.sx, sy: h.sy })}
          {...handleProps}
        />
      ))}

      {/* Barra de acciones: debajo del recuadro, contra-rotada para leerse derecha */}
      <div
        className="absolute left-1/2 top-full mt-3 flex items-center gap-1 whitespace-nowrap"
        style={{ transform: `translateX(-50%) rotate(${-box.angle}deg)` }}
      >
        <span
          className={`px-1.5 py-1 text-[11px] tabular-nums bg-black/75 text-white ${
            rotating ? "ring-2 ring-[#BD0E0D]" : ""
          }`}
        >
          {(Math.round(box.angle * 10) / 10).toLocaleString()}°
        </span>
        {box.angle !== 0 && (
          <button
            type="button"
            onClick={() => onChange({ ...box, angle: 0 })}
            className="px-1.5 py-1 text-[11px] bg-white border border-gray-300 hover:border-[#BD0E0D]"
            title={t("resetRotation")}
          >
            0°
          </button>
        )}
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="px-2 py-1 text-xs font-semibold text-white bg-[#BD0E0D] hover:bg-[#a50c0b] disabled:opacity-50"
        >
          {busy ? "…" : `✂ ${t("confirm")}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-xs bg-white border border-gray-300 hover:border-gray-500"
          aria-label={t("cancel")}
          title={`${t("cancel")} (Esc)`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

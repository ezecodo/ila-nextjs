"use client";

// Revista física en 3D (CSS preserve-3d), estática y calmada — pensada para móvil.
// Cara = portada, canto de páginas a la derecha/arriba, lomo rojo, brillo de imprenta
// y sombra de contacto. Sin parallax: que se note que es una revista, sin distraer.

const RED = "#BD0E0D";
const REDDEEP = "#7a0908";
const FUT = "var(--font-futura)";
const COVER_RATIO = 538 / 756; // ancho/alto de la portada de ila

export default function MagazineMockup({
  cover,
  issue = "",
  alt = "",
  width = 230,
  depth = 12,
  angle = -22,
  tilt = -7,
  gloss = true,
  shadow = true,
}) {
  const H = Math.round(width / COVER_RATIO);
  const D = depth;
  const ry = angle;
  const rx = tilt;

  const pagesV =
    "repeating-linear-gradient(to right, #f4f0e7 0px, #f4f0e7 1px, #d7d0c0 1px, #d7d0c0 2.4px)";
  const pagesH =
    "repeating-linear-gradient(to bottom, #f4f0e7 0px, #f4f0e7 1px, #d7d0c0 1px, #d7d0c0 2.4px)";
  // Sin overflow:hidden: en navegadores móviles (iOS Safari) aplicar overflow a
  // una cara dentro de preserve-3d colapsa su profundidad 3D (z-fighting) y la
  // contraportada/cantos terminan pisando la portada. backfaceVisibility evita
  // que la cara trasera roja se transparente sobre la portada.
  const face = {
    position: "absolute",
    left: "50%",
    top: "50%",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  };

  return (
    <div
      style={{
        position: "relative",
        width,
        height: H,
        perspective: 1700,
        perspectiveOrigin: "50% 42%",
      }}
    >
      {shadow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            width: width * 1.18,
            height: width * 0.42,
            transform: `translate(-50%, ${-H * 0.1}px) translateX(${ry * 1.4}px) rotateX(78deg)`,
            transformOrigin: "center top",
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(40,34,30,0.30) 0%, transparent 72%)",
            filter: "blur(10px)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
        }}
      >
        {/* CONTRAPORTADA — al fondo */}
        <div
          style={{
            ...face,
            width,
            height: H,
            background: RED,
            transform: `translate(-50%,-50%) rotateY(180deg) translateZ(${D / 2}px)`,
          }}
        />

        {/* LOMO izquierdo — rojo ila */}
        <div
          style={{
            ...face,
            width: D,
            height: H,
            background: `linear-gradient(to right, ${REDDEEP}, ${RED})`,
            transform: `translate(-50%,-50%) rotateY(-90deg) translateZ(${width / 2}px)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {issue && (
            <span
              style={{
                fontFamily: FUT,
                fontWeight: 700,
                fontSize: Math.min(11, D * 0.42),
                color: "#fff",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                letterSpacing: "0.06em",
                whiteSpace: "nowrap",
                opacity: 0.92,
              }}
            >
              {issue}
            </span>
          )}
        </div>

        {/* CANTO derecho — páginas */}
        <div
          style={{
            ...face,
            width: D,
            height: H,
            background: pagesV,
            transform: `translate(-50%,-50%) rotateY(90deg) translateZ(${width / 2}px)`,
            boxShadow: "inset 0 0 8px rgba(0,0,0,0.18)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.12), transparent 14%, transparent 86%, rgba(0,0,0,0.14))",
            }}
          />
        </div>

        {/* CANTO inferior — páginas */}
        <div
          style={{
            ...face,
            width,
            height: D,
            background: pagesH,
            transform: `translate(-50%,-50%) rotateX(-90deg) translateZ(${H / 2}px)`,
          }}
        />

        {/* CANTO superior — páginas */}
        <div
          style={{
            ...face,
            width,
            height: D,
            background: pagesH,
            transform: `translate(-50%,-50%) rotateX(90deg) translateZ(${H / 2}px)`,
            filter: "brightness(1.05)",
          }}
        />

        {/* CARA — portada (al frente) */}
        <div
          style={{
            ...face,
            width,
            height: H,
            transform: `translate(-50%,-50%) translateZ(${D / 2}px)`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={alt}
            draggable="false"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {/* sombra hacia el lomo */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 12%, rgba(0,0,0,0) 86%, rgba(255,255,255,0.06) 100%)",
            }}
          />
          {/* brillo de imprenta */}
          {gloss && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.12) 47%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 53%, transparent 70%)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

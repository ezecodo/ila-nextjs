"use client";
import Image from "next/image";
import { useState } from "react";

/**
 * Landscape -> aspect 16/9 + cover
 * Portrait  -> aspect 3/4 + contain (sin cortes, con barras)
 * Square    -> aspect 1/1 + cover
 * Sesgo hacia arriba para no cortar caras con cover.
 */
export default function SmartImage({
  src,
  alt = "",
  className = "",
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 1024px",
  faceTopBias = true,
}) {
  const [orient, setOrient] = useState(null); // "landscape" | "portrait" | "square"

  const wrapperClass =
    orient === "portrait"
      ? "aspect-[3/4]"
      : orient === "square"
        ? "aspect-square"
        : "aspect-[16/9]"; // por defecto landscape

  const objectFit = orient === "portrait" ? "contain" : "cover";
  const objectPosition = faceTopBias ? "50% 30%" : "50% 50%";

  return (
    <div className={`relative w-full ${wrapperClass} bg-gray-100 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        style={{ objectFit, objectPosition }}
        onLoadingComplete={({ naturalWidth: w, naturalHeight: h }) => {
          if (!w || !h) return;
          const r = w / h;
          setOrient(r === 1 ? "square" : r > 1 ? "landscape" : "portrait");
        }}
      />
    </div>
  );
}

// components/MagazineMockup.js
import Image from "next/image";
import React from "react";

// Añade esto a globals.css o tu archivo de estilos globales:
// .body-texture { background: #f8f8f8; }
// .mockup-shadow { box-shadow: 0 20px 40px rgba(0,0,0,0.15); }

export default function MagazineMockup({
  src,
  alt = "",
  width = 360,
  height = 480,
}) {
  return (
    <div className="flex justify-center p-8 body-texture">
      <div
        className="bg-white rounded-lg overflow-hidden mockup-shadow"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="object-cover w-full h-full"
          priority
        />
      </div>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";

export default function InfoBox() {
  return (
    <div className="bg-blue-600 text-white p-6 rounded-lg shadow-lg flex flex-col items-center text-center gap-4">
      {/* Logo u otra imagen */}
      <div className="w-20 h-20 relative">
        <Image
          src="/icons/info-icon.png" // usa una imagen distinta o la misma
          alt="Info Icon"
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>

      {/* Texto */}
      <div>
        <h3 className="text-xl font-bold mb-2">¿Sabías que...?</h3>
        <p className="text-sm leading-snug">
          ILA ha publicado más de 1800 artículos sobre temas sociales, políticos
          y culturales de América Latina desde 1978.
        </p>
      </div>

      {/* Botón opcional */}
      <Link
        href="/archivo"
        className="bg-white text-blue-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition"
      >
        Explorar archivo
      </Link>
    </div>
  );
}

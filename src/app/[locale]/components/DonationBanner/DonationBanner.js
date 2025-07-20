import Image from "next/image";
import Link from "next/link";

export default function DonationBanner() {
  return (
    <div className="bg-red-600 text-white p-6 shadow-lg flex flex-col items-center text-center gap-4">
      {/* Logo */}
      <div className="w-20 h-20 relative">
        <Image
          src="/ila-logo.png"
          alt="ILA Logo"
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>

      {/* Texto */}
      <div>
        <h3 className="text-xl font-bold mb-2">¡Apoya a ila!</h3>
        <p className="text-sm leading-snug">
          Tu donación nos ayuda a seguir publicando contenido independiente y
          comprometido con América Latina. Cada aporte cuenta.
        </p>
      </div>

      {/* Botón */}
      <Link
        href="/donar" // o el enlace real de donación (puede ser externo también)
        className="bg-white text-red-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition"
      >
        Donar ahora
      </Link>
    </div>
  );
}

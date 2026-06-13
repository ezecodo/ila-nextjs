"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "./CartContext";

// Botón flotante del carrito — solo mobile, aparece cuando hay ≥1 ítem.
// Reemplaza al ícono del carrito en el header mobile (que se superponía con el
// tagline) y al botón apretado bajo el dossier.
export default function CartFab() {
  const locale = useLocale();
  const { totalCount, hydrated } = useCart();

  if (!hydrated || totalCount <= 0) return null;

  const label = locale === "es" ? "Carrito" : "Warenkorb";

  return (
    <Link
      href={`/${locale}/order/single-dossier-order?focus=cart`}
      aria-label={`${label} (${totalCount})`}
      title={label}
      className="md:hidden fixed bottom-5 right-5 z-[70] flex items-center justify-center w-14 h-14 rounded-full bg-[#BD0E0D] text-white shadow-lg active:scale-95 transition-transform animate-in fade-in zoom-in duration-200"
    >
      <FaShoppingCart size={20} />
      <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full bg-white text-[#BD0E0D] text-[11px] font-black leading-none border border-[#BD0E0D]/20 shadow">
        {totalCount > 9 ? "9+" : totalCount}
      </span>
    </Link>
  );
}

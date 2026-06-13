"use client";

import Link from "next/link";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "./CartContext";

// variant: "light" (sobre rojo, blanco) | "dark" (sobre blanco, gris)
export default function CartButton({ locale, variant = "light", size = 14, onClick }) {
  const { totalCount, hydrated } = useCart();
  const count = hydrated ? totalCount : 0;

  const colorClass =
    variant === "dark"
      ? "text-gray-500 dark:text-gray-400 hover:text-[#BD0E0D] dark:hover:text-red-400"
      : "text-white/80 hover:text-white";

  const badgeClass =
    variant === "dark"
      ? "bg-[#BD0E0D] text-white"
      : "bg-white text-[#BD0E0D] border border-[#BD0E0D]/20";

  const label = locale === "es" ? "Carrito" : "Warenkorb";

  return (
    <Link
      href={`/${locale}/order/single-dossier-order?focus=cart`}
      onClick={onClick}
      title={label}
      aria-label={count > 0 ? `${label} (${count})` : label}
      className={`relative flex items-center justify-center transition-colors ${colorClass}`}
    >
      <FaShoppingCart size={size} />
      {count > 0 && (
        <span className={`absolute -top-2 -right-2 min-w-[15px] h-[15px] px-[3px] flex items-center justify-center rounded-full text-[9px] font-black leading-none ${badgeClass}`}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

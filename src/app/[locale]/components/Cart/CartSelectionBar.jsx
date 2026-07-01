"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FaShoppingCart, FaArrowRight } from "react-icons/fa";
import { useCart } from "./CartContext";

// Barra sticky inferior que aparece cuando hay Hefte en el carrito. Permite
// seguir navegando/agregando y, cuando el usuario quiera, ir al formulario de
// compra. Reemplaza al CartFab (botón flotante mobile) cubriendo mobile+desktop.
export default function CartSelectionBar() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("cart");
  const { totalCount, hydrated } = useCart();

  if (!hydrated || totalCount <= 0) return null;
  // No mostrarla dentro del propio formulario de compra (sería redundante).
  if (pathname?.includes("/order/single-dossier-order")) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] print:hidden animate-in slide-in-from-bottom duration-200">
      <div className="mx-auto max-w-3xl m-3 flex items-center justify-between gap-3 rounded-none bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.35)] pl-4 pr-2 py-2">
        <span className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100 min-w-0">
          <span className="relative flex-shrink-0">
            <FaShoppingCart className="w-4 h-4 text-[#BD0E0D]" />
            <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-none bg-[#BD0E0D] text-white text-[10px] font-black leading-none">
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          </span>
          <span className="truncate">{t("selected", { count: totalCount })}</span>
        </span>

        <Link
          href={`/${locale}/order/single-dossier-order?focus=cart`}
          className="group flex-shrink-0 inline-flex items-center gap-2 rounded-none bg-[#BD0E0D] px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm hover:bg-red-800 transition-colors"
        >
          {t("toForm")}
          <FaArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

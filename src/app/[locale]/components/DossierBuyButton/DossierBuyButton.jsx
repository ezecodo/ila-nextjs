"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useCart } from "../Cart/CartContext";

// Botón compacto "comprar dossier". Reusa la lógica de carrito del
// ArticleDossierCTA pero NO redirige: solo añade la edición al carrito y deja
// que la barra de selección (CartSelectionBar) ofrezca ir al formulario, para
// que el usuario pueda seguir agregando más Hefte.
// Pensado para vivir sobre cards cuyo wrapper sea un <Link> (por eso frena la
// propagación del click para no disparar la navegación de la card).
export default function DossierBuyButton({ edition, className = "" }) {
  const t = useTranslations("articleDossierCta");
  const { addToCart, isInCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!edition?.id || !edition.isAvailableToOrder) return null;

  const type = edition.isSpecialOffer ? "offer" : "normal";
  const inCart = isInCart(edition.id, type);

  const handleBuy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(edition.id, type, 1);
    setJustAdded(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleBuy}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-[#BD0E0D] text-white text-[11px] font-bold uppercase tracking-wide shadow-sm hover:bg-red-800 transition-all duration-200 ${className}`}
    >
      {justAdded ? (
        <>
          <FaCheck className="w-3 h-3" />
          {t("added")}
        </>
      ) : (
        <>
          <FaShoppingCart className="w-3 h-3 group-hover:scale-110 transition-transform" />
          {inCart ? t("orderMoreButton") : t("orderButton")}
        </>
      )}
    </button>
  );
}

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../components/Cart/CartContext";
import MiniEditionCard from "../../components/Editions/MiniEditionCard/MiniEditionCard";
import OrderForm from "../../components/OrderForm/OrderForm";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import countries from "i18n-iso-countries";
import de from "i18n-iso-countries/langs/de.json";
import es from "i18n-iso-countries/langs/es.json";

countries.registerLocale(de);
countries.registerLocale(es);

// 👇 añade esto después de tus imports
type RecipientData = {
  salutation: string;
  firstName: string;
  lastName: string;
  institution: string;
  street: string;
  addressExtra: string;
  zip: string;
  city: string;
  country: string;
  phone: string;
};

// splits[itemKey][recipientIndex] = qty asignada a ese destinatario.
// recipientIndex: -1 = comprador, 0 = Empfänger 1, 1 = Empfänger 2
type ItemSplit = Record<number, number>;
type SplitsMap = Record<string, ItemSplit>;

type OrderFormProps = {
  selectedNormal: EditionWithQty[];
  selectedOffers: EditionWithQty[];
  recipients: RecipientData[];
  splits: SplitsMap;
  onOrderSuccess?: () => void;
};
// 👇 creamos un alias con tipado
const TypedOrderForm = OrderForm as React.FC<OrderFormProps>;

type Edition = {
  id: number;
  number: number;
  title: string;
  titleES?: string;
  datePublished?: string;
  coverImage?: string;
  isAvailableToOrder: boolean;
  isSpecialOffer?: boolean;
};
type EditionWithQty = Edition & { qty: number };

const emptyRecipient = (country: string): RecipientData => ({
  salutation: "",
  firstName: "",
  lastName: "",
  institution: "",
  street: "",
  addressExtra: "",
  zip: "",
  city: "",
  country,
  phone: "",
});

function SingleDossierOrderContent() {
  const locale = useLocale();
  const t = useTranslations("orderForm");
  const searchParams = useSearchParams();
  const preselectEditionId = searchParams.get("editionId");
  const focusParam = searchParams.get("focus");
  const {
    items: cartItems,
    hydrated: cartHydrated,
    replaceCart,
    clearCart,
  } = useCart();
  const seededRef = useRef(false);
  const selectorRef = useRef<HTMLElement | null>(null);
  const [offerMinWarning, setOfferMinWarning] = useState(false);
  const [normalEditions, setNormalEditions] = useState<Edition[]>([]);
  const [offerEditions, setOfferEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNormal, setSelectedNormal] = useState<EditionWithQty[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<EditionWithQty[]>([]);

  // estados independientes para los filtros
  const [yearNormal, setYearNormal] = useState<string>("all");
  const [yearOffer, setYearOffer] = useState<string>("all");
  const [dossierType, setDossierType] = useState<"normal" | "offer">("normal");

  // 👉 destinatarios alternativos (máx. 2 además del comprador)
  const defaultCountry = locale === "de" ? "Deutschland" : "España";
  const [activeRecipients, setActiveRecipients] = useState<number>(0);
  const [recipients, setRecipients] = useState<RecipientData[]>([
    emptyRecipient(defaultCountry),
    emptyRecipient(defaultCountry),
  ]);
  // splits: cuántas unidades de cada item van a cada destinatario
  const [splits, setSplits] = useState<SplitsMap>({});

  // diálogo modal para mover unidades entre envíos
  const [moveDialog, setMoveDialog] = useState<{
    itemKey: string;
    itemNumber: number;
    itemTitle: string;
    fromIdx: number;
    maxQty: number;
  } | null>(null);
  const [moveDest, setMoveDest] = useState<number>(0);
  const [moveQty, setMoveQty] = useState<number>(1);

  const updateRecipient = (
    index: number,
    field: keyof RecipientData,
    value: string
  ) => {
    setRecipients((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Añade `delta` unidades de un item al split del comprador (-1).
  // Si delta<0, se quita primero del comprador, luego de rec0, luego de rec1.
  const adjustSplit = (key: string, delta: number) => {
    setSplits((prev) => {
      const cur: ItemSplit = { ...(prev[key] || {}) };
      if (delta > 0) {
        cur[-1] = (cur[-1] || 0) + delta;
      } else {
        let toRemove = -delta;
        for (const idx of [-1, 0, 1]) {
          if (toRemove <= 0) break;
          const have = cur[idx] || 0;
          const take = Math.min(have, toRemove);
          cur[idx] = have - take;
          toRemove -= take;
        }
      }
      return { ...prev, [key]: cur };
    });
  };

  // Mueve `qty` unidades de un item entre destinatarios
  const moveUnits = (
    key: string,
    fromIdx: number,
    toIdx: number,
    qty: number
  ) => {
    setSplits((prev) => {
      const cur: ItemSplit = { ...(prev[key] || {}) };
      const have = cur[fromIdx] || 0;
      const move = Math.min(have, qty);
      cur[fromIdx] = have - move;
      cur[toIdx] = (cur[toIdx] || 0) + move;
      return { ...prev, [key]: cur };
    });
  };

  // Añade un destinatario extra (hasta 2)
  const addRecipient = () => {
    setActiveRecipients((prev) => Math.min(prev + 1, 2));
  };

  // Quita el último destinatario: devuelve sus items al comprador y resetea sus datos
  const removeLastRecipient = () => {
    setActiveRecipients((prev) => {
      const newCount = Math.max(prev - 1, 0);
      const removedIdx = newCount; // índice del que se quita
      // mover unidades al comprador
      setSplits((p) => {
        const next: SplitsMap = {};
        for (const [key, split] of Object.entries(p)) {
          const ns: ItemSplit = { ...split };
          if ((ns[removedIdx] || 0) > 0) {
            ns[-1] = (ns[-1] || 0) + (ns[removedIdx] || 0);
            delete ns[removedIdx];
          }
          next[key] = ns;
        }
        return next;
      });
      // resetear datos del destinatario removido
      setRecipients((p) => {
        const next = [...p];
        next[removedIdx] = emptyRecipient(defaultCountry);
        return next;
      });
      return newCount;
    });
  };

  // Abre el diálogo de mover para un item desde un origen
  const openMoveDialog = (
    itemKey: string,
    itemNumber: number,
    itemTitle: string,
    fromIdx: number,
    currentQty: number
  ) => {
    // primer destino disponible distinto del origen
    const dests: number[] = [];
    if (fromIdx !== -1) dests.push(-1);
    for (let i = 0; i < activeRecipients; i++) {
      if (i !== fromIdx) dests.push(i);
    }
    if (dests.length === 0) return;
    setMoveDest(dests[0]);
    setMoveQty(1);
    setMoveDialog({
      itemKey,
      itemNumber,
      itemTitle,
      fromIdx,
      maxQty: currentQty,
    });
  };

  const closeMoveDialog = () => setMoveDialog(null);

  const confirmMove = () => {
    if (!moveDialog) return;
    moveUnits(moveDialog.itemKey, moveDialog.fromIdx, moveDest, moveQty);
    setMoveDialog(null);
  };

  const addToOrder = (edition: Edition, type: "normal" | "offer") => {
    const key = `${type}-${edition.id}`;
    if (type === "normal") {
      setSelectedNormal((prev) => {
        const exists = prev.find((item) => item.id === edition.id);
        if (exists) {
          return prev.map((item) =>
            item.id === edition.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [...prev, { ...edition, qty: 1 }];
      });
    } else if (type === "offer") {
      setSelectedOffers((prev) => {
        const exists = prev.find((item) => item.id === edition.id);
        if (exists) {
          return prev.map((item) =>
            item.id === edition.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [...prev, { ...edition, qty: 1 }];
      });
    }
    adjustSplit(key, 1);
  };

  const updateQty = (
    type: "normal" | "offer",
    id: number,
    delta: number
  ) => {
    const key = `${type}-${id}`;
    const setter = type === "normal" ? setSelectedNormal : setSelectedOffers;
    let removed = false;
    setter((prev) => {
      const next = prev
        .map((item) => item.id === id ? { ...item, qty: item.qty + delta } : item)
        .filter((item) => {
          if (item.id === id && item.qty <= 0) {
            removed = true;
            return false;
          }
          return true;
        });
      return next;
    });
    if (removed) {
      setSplits((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      adjustSplit(key, delta);
    }
  };

  const removeItem = (type: "normal" | "offer", id: number) => {
    if (type === "normal") setSelectedNormal((prev) => prev.filter((item) => item.id !== id));
    else setSelectedOffers((prev) => prev.filter((item) => item.id !== id));
    const key = `${type}-${id}`;
    setSplits((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  useEffect(() => {
    fetch("/api/editions")
      .then((res) => res.json())
      .then((data: Edition[]) => {
        // Filtrar solo las ediciones disponibles para ordenar
        const available = data.filter((e) => e.isAvailableToOrder);

        // Separar en normales (sin oferta especial) y ofertas especiales
        const normal = available.filter((e) => !e.isSpecialOffer);
        const offers = available.filter((e) => e.isSpecialOffer);
        setNormalEditions(normal);
        setOfferEditions(offers);

        // Auto-seleccionar el año más reciente al cargar
        const mostRecentNormal = normal
          .map((e) => (e.datePublished ? new Date(e.datePublished).getFullYear() : null))
          .filter((y): y is number => y !== null)
          .sort((a, b) => b - a)[0];
        if (mostRecentNormal) setYearNormal(String(mostRecentNormal));

        const mostRecentOffer = offers
          .map((e) => (e.datePublished ? new Date(e.datePublished).getFullYear() : null))
          .filter((y): y is number => y !== null)
          .sort((a, b) => b - a)[0];
        if (mostRecentOffer) setYearOffer(String(mostRecentOffer));

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading editions:", err);
        setLoading(false);
      });
  }, []);

  // Sembrar selección desde el carrito (una sola vez, cuando editions y carrito están listos).
  // El form toma una "foto" del carrito al entrar; luego sincroniza de vuelta.
  useEffect(() => {
    if (loading || !cartHydrated || seededRef.current) return;
    seededRef.current = true;

    const byId = new Map<number, Edition>();
    [...normalEditions, ...offerEditions].forEach((e) => byId.set(e.id, e));

    // Combinar items del carrito con un posible ?editionId (deep-link del editorial)
    const seed = new Map<string, { edition: Edition; type: "normal" | "offer"; qty: number }>();
    for (const it of cartItems) {
      const edition = byId.get(it.id);
      if (!edition) continue;
      const type = edition.isSpecialOffer ? "offer" : "normal";
      seed.set(`${type}-${edition.id}`, { edition, type, qty: it.qty });
    }
    if (preselectEditionId) {
      const edition = byId.get(Number(preselectEditionId));
      if (edition) {
        const type = edition.isSpecialOffer ? "offer" : "normal";
        const key = `${type}-${edition.id}`;
        if (!seed.has(key)) seed.set(key, { edition, type, qty: 1 });
      }
    }

    if (seed.size === 0) return;

    const nextNormal: EditionWithQty[] = [];
    const nextOffers: EditionWithQty[] = [];
    const nextSplits: SplitsMap = {};
    let hasOffer = false;
    let lastType: "normal" | "offer" = "normal";

    seed.forEach(({ edition, type, qty }, key) => {
      const withQty: EditionWithQty = { ...edition, qty };
      if (type === "offer") {
        nextOffers.push(withQty);
        hasOffer = true;
      } else {
        nextNormal.push(withQty);
      }
      nextSplits[key] = { [-1]: qty };
      lastType = type;
    });

    setSelectedNormal(nextNormal);
    setSelectedOffers(nextOffers);
    setSplits(nextSplits);
    setDossierType(lastType);

    // Si hay ofertas pero no se llega al mínimo de 3, llevar a la pestaña de ofertas.
    // Si no, y se llegó con ?focus=cart (botón del carrito), bajar a la lista de items.
    const offerQty = nextOffers.reduce((s, it) => s + it.qty, 0);
    if (hasOffer && offerQty < 3) {
      setDossierType("offer");
      setOfferMinWarning(true);
      setTimeout(() => {
        selectorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } else if (focusParam === "cart") {
      setTimeout(() => {
        document
          .getElementById("cartSection")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [loading, cartHydrated, cartItems, normalEditions, offerEditions, preselectEditionId, focusParam]);

  // Sincronizar la selección de vuelta al carrito (sólo después del seed inicial)
  useEffect(() => {
    if (!seededRef.current) return;
    const next = [
      ...selectedNormal.map((it) => ({ id: it.id, type: "normal" as const, qty: it.qty })),
      ...selectedOffers.map((it) => ({ id: it.id, type: "offer" as const, qty: it.qty })),
    ];
    replaceCart(next);
  }, [selectedNormal, selectedOffers, replaceCart]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  // 👉 Años para normales
  const yearsNormal: number[] = Array.from(
    new Set(
      normalEditions
        .map((e) =>
          e.datePublished ? new Date(e.datePublished).getFullYear() : null
        )
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a);

  // 👉 Años para ofertas
  const yearsOffer: number[] = Array.from(
    new Set(
      offerEditions
        .map((e) =>
          e.datePublished ? new Date(e.datePublished).getFullYear() : null
        )
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a);

  // 👉 Filtrar normales por año
  const filteredNormal =
    yearNormal === "all"
      ? normalEditions
      : normalEditions.filter(
          (e) =>
            e.datePublished &&
            new Date(e.datePublished).getFullYear().toString() === yearNormal
        );

  // 👉 Filtrar ofertas por año
  const filteredOffer =
    yearOffer === "all"
      ? offerEditions
      : offerEditions.filter(
          (e) =>
            e.datePublished &&
            new Date(e.datePublished).getFullYear().toString() === yearOffer
        );

  const totalItems =
    selectedNormal.reduce((sum, item) => sum + item.qty, 0) +
    selectedOffers.reduce((sum, item) => sum + item.qty, 0);

  const activeYears = dossierType === "normal" ? yearsNormal : yearsOffer;
  const activeYear = dossierType === "normal" ? yearNormal : yearOffer;
  const setActiveYear = dossierType === "normal" ? setYearNormal : setYearOffer;
  const activeEditions = dossierType === "normal" ? filteredNormal : filteredOffer;

  const handleTypeChange = (type: "normal" | "offer") => {
    setDossierType(type);
    if (type === "normal") {
      setYearNormal(yearsNormal.length > 0 ? String(yearsNormal[0]) : "all");
    } else {
      setYearOffer(yearsOffer.length > 0 ? String(yearsOffer[0]) : "all");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Hero — negative margins to break out of LayoutShell padding ── */}
      <div className="-mx-2 sm:-mx-3 md:-mx-4 lg:-mx-6 relative bg-[#BD0E0D] text-white overflow-hidden">
        {/* Decorative diagonal stripe */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-55deg, #fff 0px, #fff 1px, transparent 1px, transparent 28px)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-14 text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-2">
            {t("orderTitle")}
          </h1>
          <p className="text-white/70 text-sm md:text-base font-semibold uppercase tracking-widest mb-6">
            {t("heroSubtitle")}
          </p>

          {/* Pills */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6">
            {[t("heroPill1"), t("heroPill2"), t("heroPill3")].map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-medium"
              >
                <span className="text-white/70">✓</span>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave */}
        <svg
          className="w-full block"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z"
            className="fill-gray-50 dark:fill-gray-950"
          />
        </svg>
      </div>

      {/* ── Content ── */}
      <div className={`max-w-6xl mx-auto px-4 dark:text-gray-200 ${totalItems > 0 ? "pb-28" : "pb-14"}`}>

      {/* ── Selector de tipo + grid unificado ── */}
      <section ref={selectorRef} className="pt-8 mb-20 scroll-mt-24">

        {/* Aviso: faltan ejemplares para el mínimo de la oferta */}
        {offerMinWarning && selectedOffers.reduce((s, i) => s + i.qty, 0) < 3 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-4">
            <span className="text-2xl leading-none">🏷️</span>
            <div className="text-sm">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                {locale === "de"
                  ? `Noch ${3 - selectedOffers.reduce((s, i) => s + i.qty, 0)} Heft(e) bis zum Sonderangebot`
                  : `Faltan ${3 - selectedOffers.reduce((s, i) => s + i.qty, 0)} ejemplar(es) para la oferta`}
              </p>
              <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                {locale === "de"
                  ? "Sonderangebote gelten ab 3 Heften (2,40 € pro Heft). Wähle unten weitere aus."
                  : "Las ofertas especiales aplican a partir de 3 ejemplares (2,40 € c/u). Elegí más abajo."}
              </p>
            </div>
          </div>
        )}

        {/* Type selector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Normal */}
          <button
            onClick={() => handleTypeChange("normal")}
            className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
              dossierType === "normal"
                ? "border-[#BD0E0D] bg-red-50 dark:bg-red-950/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {dossierType === "normal" && (
              <span className="absolute top-3 right-3 w-6 h-6 bg-[#BD0E0D] text-white rounded-full flex items-center justify-center text-xs font-black">✓</span>
            )}
            <div className="text-3xl mb-3">📰</div>
            <h3 className="font-bold text-lg mb-1 dark:text-gray-100">{t("normalSectionTitle")}</h3>
            <p className="text-[#BD0E0D] font-bold text-sm mb-2">
              {locale === "de" ? "ab 6 € / 7 € pro Heft" : "desde 6 € / 7 € por ejemplar"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {locale === "de"
                ? "Versand ab 2 Heften kostenlos · inkl. MwSt."
                : "Envío gratuito desde 2 ejemplares · IVA incluido"}
            </p>
          </button>

          {/* Sonderangebot */}
          <button
            onClick={() => handleTypeChange("offer")}
            className={`relative text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
              dossierType === "offer"
                ? "border-[#BD0E0D] bg-red-50 dark:bg-red-950/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            {dossierType === "offer" ? (
              <span className="absolute top-3 right-3 w-6 h-6 bg-[#BD0E0D] text-white rounded-full flex items-center justify-center text-xs font-black">✓</span>
            ) : (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-black rounded-full uppercase tracking-wide">DEAL</span>
            )}
            <div className="text-3xl mb-3">🏷️</div>
            <h3 className="font-bold text-lg mb-1 dark:text-gray-100">{t("offerSectionTitle")}</h3>
            <p className="text-[#BD0E0D] font-bold text-sm mb-2">
              {locale === "de" ? "ab 2,40 € pro Heft" : "desde 2,40 € por ejemplar"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {locale === "de"
                ? "3 Hefte 7,50 € · 5 Hefte 12,00 € · Versand kostenlos"
                : "3 ejemplares 7,50 € · 5 ejemplares 12,00 € · Envío gratuito"}
            </p>
          </button>
        </div>

        {/* Pricing stat cards — cambia según el tipo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          {dossierType === "normal" ? (
            <>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#BD0E0D]">7 €</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de" ? "ab 2025" : "desde 2025"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#BD0E0D]">6 €</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de" ? "ab 2017" : "desde 2017"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#BD0E0D]">5 €</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de" ? "Nachdrucke" : "Reimpresiones"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl">🚚</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de"
                    ? "+0,50 € (1 Heft) · ab 2 Heften kostenlos"
                    : "+0,50 € (1 ejemplar) · gratuito desde 2"}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#BD0E0D]">7,50 €</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de" ? "3 Hefte" : "3 ejemplares"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#BD0E0D]">12 €</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de" ? "5 Hefte" : "5 ejemplares"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#BD0E0D]">2,40 €</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de" ? "ab / pro Heft" : "mín. / por ejemplar"}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center">
                <p className="text-2xl">🚚</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {locale === "de"
                    ? "Versand kostenlos · mind. 3 Hefte"
                    : "Envío gratuito · mín. 3 ejemplares"}
                </p>
              </div>
            </>
          )}
        </div>
        {/* Fine print */}
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-6">
          {dossierType === "normal"
            ? locale === "de"
              ? "Versand: +0,50 € innerhalb Deutschlands · inkl. MwSt."
              : "Envío: +0,50 € (Alemania) · IVA incluido"
            : locale === "de"
              ? "Mindestbestellung: 3 Hefte"
              : "Pedido mínimo: 3 ejemplares"}
        </p>

        {/* Year filter bar */}
        {activeYears.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap pr-3 border-r border-gray-200 dark:border-gray-700">
                {locale === "de" ? "Jahr" : "Año"}
              </span>
              <button
                onClick={() => setActiveYear("all")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeYear === "all"
                    ? "bg-[#BD0E0D] text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#BD0E0D] hover:text-[#BD0E0D] dark:hover:border-red-500 dark:hover:text-red-400"
                }`}
              >
                {locale === "de" ? "Alle" : "Todos"}
              </button>
              {activeYears.map((y) => (
                <button
                  key={y}
                  onClick={() => setActiveYear(String(y))}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    activeYear === String(y)
                      ? "bg-[#BD0E0D] text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#BD0E0D] hover:text-[#BD0E0D] dark:hover:border-red-500 dark:hover:text-red-400"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result count */}
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          {activeEditions.length}{" "}
          {locale === "de" ? "Hefte verfügbar" : "ejemplares disponibles"}
        </p>

        {/* Edition grid */}
        {activeEditions.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {activeEditions.map((edition) => (
              <div
                key={edition.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
              >
                <MiniEditionCard edition={edition} />
                <div className="px-3 pb-3 mt-auto">
                  <button
                    onClick={() => addToOrder(edition, dossierType)}
                    className="w-full py-1.5 bg-[#BD0E0D] hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {t("add")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            {locale === "de" ? "Keine Hefte verfügbar." : "No hay ejemplares disponibles."}
          </p>
        )}
      </section>
      {/* 🔹 Carrito + Formulario */}
      <section className="mt-16">
        <div id="cartSection" className="mb-10 scroll-mt-24">
          {(selectedNormal.length > 0 || selectedOffers.length > 0) && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden mb-8">
              {/* Cart header */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <span className="text-lg">🛒</span>
                <h3 className="font-bold text-base dark:text-gray-100">
                  {locale === "de" ? "Ihre Auswahl" : "Su selección"}
                </h3>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  {totalItems}{" "}
                  {locale === "de"
                    ? totalItems === 1 ? "Heft" : "Hefte"
                    : totalItems === 1 ? "ejemplar" : "ejemplares"}
                </span>
              </div>

              {/* Normal items */}
              {selectedNormal.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-gray-50 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold dark:text-gray-100 truncate">
                        ila {item.number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.title}
                      </p>
                    </div>
                    {/* +/- controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQty("normal", item.id, -1)}
                        className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-semibold dark:text-gray-200">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty("normal", item.id, 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>
                    {/* Remove */}
                    <button
                      onClick={() => removeItem("normal", item.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                      aria-label="Entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Offer items */}
              {selectedOffers.length > 0 && (
                <>
                  {selectedOffers.length < 3 && (
                    <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30">
                      <p className="text-amber-700 dark:text-amber-400 text-xs font-medium">
                        ⚠️{" "}
                        {locale === "de"
                          ? "Mindestbestellung Sonderangebote: 3 Hefte"
                          : "Pedido mínimo ofertas especiales: 3 ejemplares"}
                      </p>
                    </div>
                  )}
                  {selectedOffers.map((item) => (
                    <div
                      key={item.id}
                      className="border-b border-gray-50 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3 px-5 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold dark:text-gray-100 truncate">
                              ila {item.number}
                            </p>
                            <span className="px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-black rounded-full uppercase">
                              DEAL
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.title}
                          </p>
                        </div>
                        {/* +/- controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateQty("offer", item.id, -1)}
                            className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold dark:text-gray-200">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty("offer", item.id, 1)}
                            className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                        {/* Remove */}
                        <button
                          onClick={() => removeItem("offer", item.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                          aria-label="Entfernen"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        {/* 🔹 Envíos: una tarjeta por destinatario */}
        {(selectedNormal.length > 0 || selectedOffers.length > 0) && (() => {
          const itemsForShipment = (destIdx: number) => {
            const result: Array<{
              key: string;
              item: EditionWithQty;
              qty: number;
              isOffer: boolean;
            }> = [];
            for (const item of selectedNormal) {
              const key = `normal-${item.id}`;
              const q = splits[key]?.[destIdx] || 0;
              if (q > 0) result.push({ key, item, qty: q, isOffer: false });
            }
            for (const item of selectedOffers) {
              const key = `offer-${item.id}`;
              const q = splits[key]?.[destIdx] || 0;
              if (q > 0) result.push({ key, item, qty: q, isOffer: true });
            }
            return result;
          };

          const renderShipmentItems = (destIdx: number) => {
            const items = itemsForShipment(destIdx);
            if (items.length === 0) {
              return (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic px-3 py-2">
                  ⚠️ {t("emptyShipmentHint")}
                </p>
              );
            }
            return (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map(({ key, item, qty, isOffer }) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold dark:text-gray-100">
                          ila {item.number}
                        </span>
                        {isOffer && (
                          <span className="px-1.5 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-black rounded-full uppercase">
                            DEAL
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                          ×{qty}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.title}
                      </p>
                    </div>
                    {activeRecipients > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          openMoveDialog(
                            key,
                            item.number,
                            item.title,
                            destIdx,
                            qty
                          )
                        }
                        className="text-xs px-2.5 py-1 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition whitespace-nowrap"
                      >
                        {t("moveButton")} →
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            );
          };

          return (
            <div className="max-w-2xl mx-auto mb-8 space-y-4">
              <h3 className="font-bold text-base dark:text-gray-100 flex items-center gap-2">
                <span>📮</span>
                <span>{t("shipmentsTitle")}</span>
              </h3>

              {/* Envío del comprador (siempre presente) */}
              <div className="bg-white dark:bg-gray-900 border-2 border-red-200 dark:border-red-900/40 rounded-xl overflow-hidden">
                <div className="bg-red-50 dark:bg-red-950/30 px-4 py-2.5 border-b border-red-100 dark:border-red-900/40">
                  <h4 className="font-bold text-sm text-red-800 dark:text-red-300">
                    {t("shipmentBuyerTitle")}
                  </h4>
                  <p className="text-[11px] text-red-700/70 dark:text-red-300/70 mt-0.5">
                    {t("shipmentBuyerNote")}
                  </p>
                </div>
                {renderShipmentItems(-1)}
              </div>

              {/* Envíos de destinatarios extras */}
              {Array.from({ length: activeRecipients }).map((_, idx) => {
                const isLast = idx === activeRecipients - 1;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-900/40 rounded-xl overflow-hidden"
                  >
                    <div className="bg-blue-50 dark:bg-blue-950/30 px-4 py-2.5 border-b border-blue-100 dark:border-blue-900/40 flex items-start justify-between gap-3">
                      <h4 className="font-bold text-sm text-blue-800 dark:text-blue-300">
                        {t("shipmentRecipientTitle", {
                          n: idx + 2,
                          r: idx + 1,
                        })}
                      </h4>
                      {isLast && (
                        <button
                          type="button"
                          onClick={removeLastRecipient}
                          className="text-xs text-blue-700 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400 transition"
                          aria-label={t("removeRecipientButton")}
                          title={t("removeRecipientButton")}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Items asignados */}
                    {renderShipmentItems(idx)}

                    {/* Formulario inline del destinatario */}
                    <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-950/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("salutation")}
                          </label>
                          <select
                            value={recipients[idx].salutation}
                            onChange={(e) =>
                              updateRecipient(idx, "salutation", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          >
                            <option value="">{t("choose")}</option>
                            <option value="Frau">{t("mrs")}</option>
                            <option value="Herr">{t("mr")}</option>
                            <option value="Divers">{t("diverse")}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("firstName")} *
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].firstName}
                            onChange={(e) =>
                              updateRecipient(idx, "firstName", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("lastName")} *
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].lastName}
                            onChange={(e) =>
                              updateRecipient(idx, "lastName", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("institution")}
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].institution}
                            onChange={(e) =>
                              updateRecipient(
                                idx,
                                "institution",
                                e.target.value
                              )
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("street")} *
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].street}
                            onChange={(e) =>
                              updateRecipient(idx, "street", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("addressExtra")}
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].addressExtra}
                            onChange={(e) =>
                              updateRecipient(
                                idx,
                                "addressExtra",
                                e.target.value
                              )
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("zip")} *
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].zip}
                            onChange={(e) =>
                              updateRecipient(idx, "zip", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("city")} *
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].city}
                            onChange={(e) =>
                              updateRecipient(idx, "city", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("country")} *
                          </label>
                          <select
                            value={recipients[idx].country}
                            onChange={(e) =>
                              updateRecipient(idx, "country", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          >
                            <option value="">{t("choose")}</option>
                            {Object.entries(
                              countries.getNames(
                                locale === "de" ? "de" : "es",
                                { select: "official" }
                              ) as Record<string, string>
                            ).map(([code, name]) => (
                              <option key={code} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t("phone")}
                          </label>
                          <input
                            type="text"
                            value={recipients[idx].phone}
                            onChange={(e) =>
                              updateRecipient(idx, "phone", e.target.value)
                            }
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botón "+ Otro destinatario" */}
              {activeRecipients < 2 && (
                <button
                  type="button"
                  onClick={addRecipient}
                  className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-[#BD0E0D] hover:text-[#BD0E0D] dark:hover:border-red-500 dark:hover:text-red-400 transition-colors"
                >
                  {t("addRecipientButton")}
                </button>
              )}
            </div>
          );
        })()}

        <div id="orderFormStart" className="scroll-mt-24" />
        <TypedOrderForm
          selectedNormal={selectedNormal}
          selectedOffers={selectedOffers}
          recipients={recipients.slice(0, activeRecipients)}
          splits={
            activeRecipients > 0
              ? Object.fromEntries(
                  Object.entries(splits).map(([k, split]) => {
                    const filtered: ItemSplit = {};
                    for (const [idxStr, q] of Object.entries(split)) {
                      const idx = Number(idxStr);
                      if (idx < activeRecipients) filtered[idx] = q;
                    }
                    return [k, filtered];
                  })
                )
              : {}
          }
          onOrderSuccess={clearCart}
        />
      </section>

      {/* 🔹 Modal: mover unidades entre envíos */}
      {moveDialog && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={closeMoveDialog}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-1 dark:text-gray-100">
              {t("moveDialogTitle", { number: moveDialog.itemNumber })}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 truncate">
              {moveDialog.itemTitle}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                  {t("moveDialogDest")}
                </label>
                <select
                  value={moveDest}
                  onChange={(e) => setMoveDest(Number(e.target.value))}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-800 dark:text-gray-200"
                >
                  {moveDialog.fromIdx !== -1 && (
                    <option value={-1}>{t("buyerLabel")}</option>
                  )}
                  {Array.from({ length: activeRecipients }).map((_, idx) => {
                    if (idx === moveDialog.fromIdx) return null;
                    return (
                      <option key={idx} value={idx}>
                        {t("recipientLabel", { n: idx + 1 })}
                      </option>
                    );
                  })}
                </select>
              </div>

              {moveDialog.maxQty > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
                    {t("moveDialogQty")}{" "}
                    <span className="font-normal text-gray-500">
                      ({t("moveDialogQtyAvail", { max: moveDialog.maxQty })})
                    </span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={moveDialog.maxQty}
                    value={moveQty}
                    onChange={(e) =>
                      setMoveQty(
                        Math.max(
                          1,
                          Math.min(moveDialog.maxQty, Number(e.target.value))
                        )
                      )
                    }
                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-2 bg-white dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={closeMoveDialog}
                className="flex-1 px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200"
              >
                {t("moveDialogCancel")}
              </button>
              <button
                type="button"
                onClick={confirmMove}
                className="flex-1 px-3 py-2 text-sm font-medium rounded-md bg-[#BD0E0D] text-white hover:bg-red-800 transition"
              >
                {t("moveDialogConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── Floating cart bar ── */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          totalItems > 0 ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-[#BD0E0D] text-white shadow-2xl px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative">
                <span className="text-2xl">🛒</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-[#BD0E0D] text-[10px] font-black rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </span>
              <div>
                <p className="font-bold text-sm leading-tight">
                  {totalItems}{" "}
                  {locale === "de"
                    ? totalItems === 1 ? "Heft ausgewählt" : "Hefte ausgewählt"
                    : totalItems === 1 ? "ejemplar seleccionado" : "ejemplares seleccionados"}
                </p>
                {selectedOffers.length > 0 && selectedOffers.reduce((s, i) => s + i.qty, 0) < 3 && (
                  <p className="text-white/70 text-xs">
                    ⚠️{" "}
                    {locale === "de"
                      ? "Mind. 3 Sonderangebote erforderlich"
                      : "Mín. 3 ofertas especiales requeridas"}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() =>
                document
                  .getElementById("orderFormStart")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="flex items-center gap-2 bg-white text-[#BD0E0D] font-bold text-sm px-5 py-2 rounded-full hover:bg-gray-100 transition-colors whitespace-nowrap shrink-0"
            >
              {locale === "de" ? "Zum Formular" : "Al formulario"} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SingleDossierOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-20">
          <IlaLoader />
        </div>
      }
    >
      <SingleDossierOrderContent />
    </Suspense>
  );
}

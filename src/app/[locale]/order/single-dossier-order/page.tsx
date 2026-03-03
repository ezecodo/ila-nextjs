"use client";

import { useEffect, useState } from "react";
import MiniEditionCard from "../../components/Editions/MiniEditionCard/MiniEditionCard";
import OrderForm from "../../components/OrderForm/OrderForm";
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";

// 👇 añade esto después de tus imports
type OrderFormProps = {
  selectedNormal: EditionWithQty[];
  selectedOffers: EditionWithQty[];
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

export default function SingleDossierOrderPage() {
  const locale = useLocale();
  const t = useTranslations("orderForm");
  const [normalEditions, setNormalEditions] = useState<Edition[]>([]);
  const [offerEditions, setOfferEditions] = useState<Edition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNormal, setSelectedNormal] = useState<EditionWithQty[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<EditionWithQty[]>([]);

  // estados independientes para los filtros
  const [yearNormal, setYearNormal] = useState<string>("all");
  const [yearOffer, setYearOffer] = useState<string>("all");

  const addToOrder = (edition: Edition, type: "normal" | "offer") => {
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

    // 👉 Hacer scroll automático al formulario
    document
      .getElementById("cartTitle")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <div className="max-w-6xl mx-auto px-4 pb-14 dark:text-gray-200">
      {/* 🔹 Dossiers Normales (isSpecialOffer = false) */}
      <section className="mb-20 pt-8">
        <h2 className="text-2xl font-bold mb-5 text-center dark:text-gray-100">
          {t("normalSectionTitle")}
        </h2>

        {/* Pricing info callout */}
        <div className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-8 max-w-2xl mx-auto text-sm text-gray-600 dark:text-gray-300">
          <span className="text-[#BD0E0D] font-black text-base mt-0.5 shrink-0">ℹ</span>
          <div className="leading-relaxed">
            {locale === "de" ? (
              <>
                <strong>Preise:</strong> ab 2025 <strong>7 €</strong> · ab 2017{" "}
                <strong>6 €</strong> · Nachdrucke <strong>5 €</strong>
                <br />
                Versand: +0,50 € (innerhalb Deutschlands) · ab 2 Heften kostenlos · inkl. MwSt.
              </>
            ) : (
              <>
                <strong>Precios:</strong> desde 2025 <strong>7 €</strong> · desde 2017{" "}
                <strong>6 €</strong> · Reimpresiones <strong>5 €</strong>
                <br />
                Envío: +0,50 € (Alemania) · gratuito desde 2 ejemplares · IVA incluido
              </>
            )}
          </div>
        </div>

        {/* Year filter bar */}
        {yearsNormal.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap pr-3 border-r border-gray-200 dark:border-gray-700">
                {locale === "de" ? "Jahr" : "Año"}
              </span>
              <button
                onClick={() => setYearNormal("all")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  yearNormal === "all"
                    ? "bg-[#BD0E0D] text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#BD0E0D] hover:text-[#BD0E0D] dark:hover:border-red-500 dark:hover:text-red-400"
                }`}
              >
                {locale === "de" ? "Alle" : "Todos"}
              </button>
              {yearsNormal.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearNormal(String(y))}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    yearNormal === String(y)
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
          {filteredNormal.length}{" "}
          {locale === "de" ? "Hefte verfügbar" : "ejemplares disponibles"}
        </p>

        {/* Edition grid */}
        {filteredNormal.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredNormal.map((edition) => (
              <div
                key={edition.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
              >
                <MiniEditionCard edition={edition} />
                <div className="px-3 pb-3 mt-auto">
                  <button
                    onClick={() => addToOrder(edition, "normal")}
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
            {locale === "de"
              ? `Keine Hefte für ${yearNormal === "all" ? "diese Auswahl" : yearNormal} verfügbar.`
              : `No hay ejemplares para ${yearNormal === "all" ? "esta selección" : yearNormal}.`}
          </p>
        )}
      </section>

      {/* 🔹 Sonderangebote (isSpecialOffer = true) */}
      <section className="mb-20">
        <h2 className="text-2xl font-bold mb-5 text-center dark:text-gray-100">
          {t("offerSectionTitle")}
        </h2>

        {/* Pricing info callout */}
        <div className="flex items-start gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-8 max-w-2xl mx-auto text-sm text-gray-600 dark:text-gray-300">
          <span className="text-[#BD0E0D] font-black text-base mt-0.5 shrink-0">ℹ</span>
          <div className="leading-relaxed">
            {locale === "de" ? (
              <>
                3 Hefte für <strong>7,50 €</strong> · 5 Hefte für{" "}
                <strong>12,00 €</strong> · <strong>ab 2,40 € pro Heft</strong>
                <br />
                Mindestbestellung: 3 Hefte · Versandkosten übernimmt die ila
              </>
            ) : (
              <>
                3 ejemplares por <strong>7,50 €</strong> · 5 ejemplares por{" "}
                <strong>12,00 €</strong> · <strong>desde 2,40 € por ejemplar</strong>
                <br />
                Pedido mínimo: 3 ejemplares · Envío a cargo de ila
              </>
            )}
          </div>
        </div>

        {/* Year filter bar */}
        {yearsOffer.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap pr-3 border-r border-gray-200 dark:border-gray-700">
                {locale === "de" ? "Jahr" : "Año"}
              </span>
              <button
                onClick={() => setYearOffer("all")}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  yearOffer === "all"
                    ? "bg-[#BD0E0D] text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#BD0E0D] hover:text-[#BD0E0D] dark:hover:border-red-500 dark:hover:text-red-400"
                }`}
              >
                {locale === "de" ? "Alle" : "Todos"}
              </button>
              {yearsOffer.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearOffer(String(y))}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    yearOffer === String(y)
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
          {filteredOffer.length}{" "}
          {locale === "de" ? "Hefte verfügbar" : "ejemplares disponibles"}
        </p>

        {/* Edition grid */}
        {filteredOffer.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredOffer.map((edition) => (
              <div
                key={edition.id}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
              >
                <MiniEditionCard edition={edition} />
                <div className="px-3 pb-3 mt-auto">
                  <button
                    onClick={() => addToOrder(edition, "offer")}
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
            {locale === "de"
              ? `Keine Angebote für ${yearOffer === "all" ? "diese Auswahl" : yearOffer} verfügbar.`
              : `No hay ofertas para ${yearOffer === "all" ? "esta selección" : yearOffer}.`}
          </p>
        )}
      </section>
      {/* 🔹 Formulario de pedido */}
      <section className="mt-16">
        <section className="mb-10" id="cartSection">
          {selectedNormal.length > 0 && (
            <div className="mb-6">
              <h3 id="cartTitle" className="text-lg font-bold mb-2">
                Ihre Auswahl (Normale Dossiers)
              </h3>
              {selectedNormal.map((item, i) => (
                <div key={i} className="flex justify-between items-center mb-2">
                  <span>
                    {item.qty} × ila {item.number}: {item.title}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value, 10) || 1;
                      setSelectedNormal((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, qty } : p))
                      );
                    }}
                    className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-800 dark:text-gray-200"
                  />
                </div>
              ))}
            </div>
          )}

          {selectedOffers.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-2">Sonderangebote</h3>
              {selectedOffers.length < 3 && (
                <p className="text-red-600 text-sm mb-2">
                  ⚠️ Mindestbestellwert für Sonderangebote: 3 Hefte
                </p>
              )}
              {selectedOffers.map((item, i) => (
                <div key={i} className="flex justify-between items-center mb-2">
                  <span>
                    {item.qty} × ila {item.number}: {item.title}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value, 10) || 1;
                      setSelectedOffers((prev) =>
                        prev.map((p, idx) => (idx === i ? { ...p, qty } : p))
                      );
                    }}
                    className="w-16 border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
        <TypedOrderForm
          selectedNormal={selectedNormal}
          selectedOffers={selectedOffers}
        />
      </section>
      </div>
    </div>
  );
}

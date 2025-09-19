"use client";

import { useEffect, useState } from "react";
import EditionsCarousel from "../../components/Editions/EditionsCarousel/EditionsCarousel";
import OrderForm from "../../components/OrderForm/OrderForm";

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
      .getElementById("orderForm")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetch("/api/editions")
      .then((res) => res.json())
      .then((data: Edition[]) => {
        // Filtrar solo las ediciones disponibles para ordenar
        const available = data.filter((e) => e.isAvailableToOrder);

        // Separar en normales (sin oferta especial) y ofertas especiales
        setNormalEditions(available.filter((e) => !e.isSpecialOffer));
        setOfferEditions(available.filter((e) => e.isSpecialOffer));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading editions:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center">Loading...</p>;

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
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-12">
        Order Single Dossiers & Sonderangebote
      </h1>

      {/* 🔹 Dossiers Normales (isSpecialOffer = false) */}
      <section className="mb-20">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Einzelheftverkauf
        </h2>
        <p className="text-sm text-gray-700 mb-6 text-center leading-relaxed max-w-2xl mx-auto">
          Normalpreis eines ila-Heftes (ab 2017): <strong>6 €</strong> <br />
          Nachdrucke bestimmter vergriffener Hefte: <strong>5 €</strong> <br />
          zzgl. 0,50 € für Verpackung und Versad (innerhalb Deutschland) <br />
          Ab zwei Heften übernehmen wir die Versandkosten. <br />
          Alle Preise enthalten die gesetzliche Umsatzsteuer.
        </p>

        {/* Selector de años normales */}
        {yearsNormal.length > 0 && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setYearNormal("all")}
                className={`px-3 py-1 rounded-full text-sm transition whitespace-nowrap ${
                  yearNormal === "all"
                    ? "bg-red-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              {yearsNormal.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearNormal(String(y))}
                  className={`px-3 py-1 rounded-full text-sm transition whitespace-nowrap ${
                    yearNormal === String(y)
                      ? "bg-red-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredNormal.length > 0 ? (
          <EditionsCarousel
            editions={filteredNormal}
            onAdd={addToOrder}
            type="normal"
          />
        ) : (
          <p className="text-center text-gray-600">
            No dossiers available for{" "}
            {yearNormal === "all" ? "order" : `year ${yearNormal}`}.
          </p>
        )}
      </section>

      {/* 🔹 Sonderangebote (isSpecialOffer = true) */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-center">
          Sonderangebote
        </h2>
        <p className="text-sm text-gray-700 mb-6 text-center leading-relaxed max-w-2xl mx-auto">
          Sonderangebote aus Lagerbeständen: <br />3 ila-Ausgaben für{" "}
          <strong>7,50 Euro</strong> | 5 Hefte für <strong>12,00 Euro</strong>.{" "}
          <br />
          Alle weiteren Packmaße als Kombinationen aus drei und fünf Heften.{" "}
          <br />
          Mindestbestellwert: <strong>3 Hefte</strong>. <br />
          Kosten für Porto und Versand übernimmt die ila. <br />
          <strong>ab 2,40 € pro Heft!</strong>
        </p>

        {/* Selector de años ofertas */}
        {yearsOffer.length > 0 && (
          <div className="flex justify-center mb-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setYearOffer("all")}
                className={`px-3 py-1 rounded-full text-sm transition whitespace-nowrap ${
                  yearOffer === "all"
                    ? "bg-red-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              {yearsOffer.map((y) => (
                <button
                  key={y}
                  onClick={() => setYearOffer(String(y))}
                  className={`px-3 py-1 rounded-full text-sm transition whitespace-nowrap ${
                    yearOffer === String(y)
                      ? "bg-red-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredOffer.length > 0 ? (
          <EditionsCarousel
            editions={filteredOffer}
            onAdd={addToOrder}
            type="offer"
          />
        ) : (
          <p className="text-center text-gray-600">
            No special offer dossiers available for{" "}
            {yearOffer === "all" ? "order" : `year ${yearOffer}`}.
          </p>
        )}
      </section>
      {/* 🔹 Formulario de pedido */}
      <section className="mt-16">
        <section className="mb-10">
          {selectedNormal.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold mb-2">
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
                    className="w-16 border border-gray-300 rounded px-2 py-1"
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
    </main>
  );
}

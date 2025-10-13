"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";

// SVG Icons como componentes
const GiftIcon = ({ className = "" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
  </svg>
);

const ChevronDown = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ChevronUp = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

export default function GiftSelector({
  gifts,
  selectedGiftId,
  onSelect,
  giftDelivery,
  onDeliveryChange,
}) {
  const t = useTranslations("abo");
  const [expanded, setExpanded] = useState(false);

  if (!gifts || gifts.length === 0) {
    return (
      <p className="text-gray-500 text-sm mt-2">{t("noGiftsAvailable")}</p>
    );
  }

  const selectedGift = gifts.find((g) => g.id === selectedGiftId);

  return (
    <div className="mt-6 border-l-4 border-green-500 rounded-xl p-5 bg-gradient-to-br from-green-50 to-emerald-50/30 dark:from-green-900/10 dark:to-emerald-900/5 shadow-sm">
      {/* Título */}
      <div className="flex items-center gap-2 mb-3">
        <GiftIcon className="text-green-600 dark:text-green-400 w-5 h-5" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t("giftSectionTitle")}
        </h3>
      </div>

      {/* Intro */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        {t("giftIntroText")}
      </p>

      {/* Botón para expandir/colapsar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-between group shadow-md hover:shadow-lg"
      >
        <span className="flex items-center gap-2">
          {selectedGift ? (
            <>
              <span className="bg-white/20 px-2 py-1 rounded text-xs">✓</span>
              {selectedGift.name}
            </>
          ) : (
            t("selectGiftLabel")
          )}
        </span>
        {expanded ? (
          <ChevronUp className="w-5 h-5 transition-transform group-hover:translate-y-[-2px]" />
        ) : (
          <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-[2px]" />
        )}
      </button>

      {/* Galería visual de premios */}
      {expanded && (
        <div className="mt-5 space-y-4 animate-slideDown">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gifts.map((gift) => {
              const isSelected = selectedGiftId === gift.id;
              return (
                <div
                  key={gift.id}
                  className="flip-card-container"
                  style={{ perspective: "1000px" }}
                >
                  <div
                    onClick={() => onSelect(gift.id)}
                    className={`flip-card cursor-pointer relative transition-all duration-300 ${
                      isSelected ? "scale-[1.02]" : ""
                    }`}
                    style={{
                      transformStyle: "preserve-3d",
                      transition: "transform 0.6s",
                    }}
                  >
                    {/* FRENTE - Imagen */}
                    <div
                      className={`flip-card-front absolute inset-0 rounded-xl border-2 overflow-hidden shadow-md ${
                        isSelected
                          ? "border-green-600 ring-2 ring-green-400 shadow-xl"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      {/* Badge de selección */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 z-10 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                          <span>✓</span>
                          <span>{t("selected") || "Ausgewählt"}</span>
                        </div>
                      )}

                      {/* Imagen del premio */}
                      <div className="relative aspect-[4/5] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                        {gift.imageUrl ? (
                          <Image
                            src={gift.imageUrl}
                            alt={gift.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <GiftIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Nombre breve */}
                      <div className="p-4 bg-white dark:bg-gray-800">
                        <h4
                          className={`font-bold text-sm transition-colors ${
                            isSelected
                              ? "text-green-700 dark:text-green-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {gift.name}
                        </h4>
                      </div>

                      {/* Hint de hover */}
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Hover für Details
                      </div>
                    </div>

                    {/* REVERSO - Descripción */}
                    <div
                      className={`flip-card-back absolute inset-0 rounded-xl border-2 overflow-hidden shadow-md ${
                        isSelected
                          ? "border-green-600 ring-2 ring-green-400 shadow-xl"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {/* Badge de selección en reverso */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 z-10 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                          <span>✓</span>
                          <span>{t("selected") || "Ausgewählt"}</span>
                        </div>
                      )}

                      <div className="h-full bg-gradient-to-br from-white to-green-50/50 dark:from-gray-800 dark:to-gray-900 p-6 flex flex-col overflow-y-auto">
                        {/* Icono decorativo */}
                        <div className="flex justify-center mb-4">
                          <GiftIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>

                        {/* Título */}
                        <h4
                          className={`font-bold text-base mb-3 leading-tight ${
                            isSelected
                              ? "text-green-700 dark:text-green-400"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {gift.name}
                        </h4>

                        {/* Subtítulo */}
                        {gift.subtitle && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic mb-4 leading-relaxed">
                            {gift.subtitle}
                          </p>
                        )}

                        {/* Descripción con HTML */}
                        {gift.description && (
                          <div
                            className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed flex-1 gift-description"
                            dangerouslySetInnerHTML={{
                              __html: gift.description,
                            }}
                          />
                        )}

                        {/* Call to action */}
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="block text-center text-xs font-semibold text-green-600 dark:text-green-400">
                            {isSelected
                              ? `✓ ${t("selected")}`
                              : `→ ${t("clickToSelect")}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mensaje si no hay premio seleccionado */}
          {!selectedGiftId && (
            <div className="text-center py-3 px-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                👆 {t("hoverForDetails")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Opción de envío del premio */}
      {selectedGiftId && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 animate-fadeIn">
          <label className="block font-medium mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {t("giftDeliveryLabel")}
          </label>
          <select
            className="border border-gray-300 dark:border-gray-600 p-3 rounded-lg w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all cursor-pointer"
            value={giftDelivery || "to_payer"}
            onChange={(e) => onDeliveryChange(e.target.value)}
          >
            <option value="to_payer">{t("giftDeliverySelf")}</option>
            <option value="to_recipient">{t("giftDeliveryGiftAddress")}</option>
          </select>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Flip Card Effect */
        .flip-card-container {
          position: relative;
          aspect-ratio: 4 / 5;
        }

        .flip-card {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .flip-card-container:hover .flip-card {
          transform: rotateY(180deg);
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        /* Estilos para la descripción HTML */
        :global(.gift-description p) {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        :global(.gift-description p:last-child) {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

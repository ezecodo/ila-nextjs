"use client";

import { useEffect, useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function SubscriptionsPage() {
  const t = useTranslations("abo.admin");
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);

  // Medición dinámica del header
  useEffect(() => {
    const measureHeaderHeight = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    measureHeaderHeight();
    window.addEventListener("resize", measureHeaderHeight);
    const observer = new MutationObserver(measureHeaderHeight);
    if (headerRef.current) {
      observer.observe(headerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }
    return () => {
      window.removeEventListener("resize", measureHeaderHeight);
      observer.disconnect();
    };
  }, []);

  // Cargar suscripciones
  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/subscriptions");
        if (!res.ok) throw new Error("Error cargando suscripciones");
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      } catch (err) {
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriptions();
  }, []);

  // Abrir detalles
  async function openSubDetails(id) {
    try {
      const res = await fetch(`/api/subscriptions/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Error cargando suscripción");
      const data = await res.json();
      setSelectedSub(data);
      setShowModal(true);
    } catch (err) {
      console.error("❌ Error en openSubDetails:", err);
    }
  }

  const filteredSubs = subscriptions.filter(
    (s) =>
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <p className="text-center text-gray-500">{t("loading")}</p>;
  }

  return (
    <>
      <div ref={headerRef} className="absolute top-0 left-0 w-full -z-10" />

      <div className="max-w-7xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {t("title")}
          </h1>
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="w-full border-collapse bg-white dark:bg-gray-900 text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">
                <th className="px-5 py-3 text-left">{t("date")}</th>
                <th className="px-5 py-3 text-left">{t("customer")}</th>
                <th className="px-5 py-3 text-left">{t("email")}</th>
                <th className="px-5 py-3 text-center">{t("type")}</th>
                <th className="px-5 py-3 text-center">{t("format")}</th>
                <th className="px-5 py-3 text-center">{t("reward")}</th>
                <th className="px-5 py-3 text-center">{t("gift")}</th>
                <th className="px-5 py-3 text-center">{t("giftDuration")}</th>
                <th className="px-5 py-3 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-5 py-3 flex items-center gap-2">
                    {sub.isNew ? (
                      // 🟢 Nueva suscripción (pulsante)
                      <span className="relative flex h-3 w-3 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </span>
                    ) : (
                      // 🔴 Procesada (fijo)
                      <span className="relative flex h-3 w-3 mr-1">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 opacity-80"></span>
                      </span>
                    )}

                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">
                    {sub.firstName} {sub.lastName}
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                    {sub.email}
                  </td>
                  <td className="px-5 py-3 text-center capitalize">
                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      {sub.type.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">{sub.format}</td>
                  <td className="px-5 py-3 text-center">
                    {sub.gift ? (
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                        🏅 {sub.gift.name || t("yes")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                        {t("no")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {sub.isGift ? (
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                        🎁 {t("yes")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                        {t("no")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {sub.isGift && sub.giftSubscriptionDuration ? (
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        {sub.giftSubscriptionDuration === "ONE_YEAR"
                          ? t("oneYear")
                          : t("untilCancelled")}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => openSubDetails(sub.id)}
                      className="px-4 py-2 text-xs font-semibold rounded-md bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm transition"
                    >
                      {t("viewDetails")}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSubs.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-5 py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t("noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && selectedSub && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4"
            style={{ marginTop: `${headerHeight}px` }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto mx-4 relative">
              {/* Botón de cerrar */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-50 text-gray-500 hover:text-red-600 transition-all duration-200 text-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                aria-label="Cerrar"
              >
                ✕
              </button>

              <div className="p-6 md:p-8 pt-12">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                  {t("subscriptionFrom")} {selectedSub.firstName}{" "}
                  {selectedSub.lastName}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Información del cliente (PAGADOR) */}
                  <div className="space-y-3">
                    <p>
                      <span className="font-semibold">{t("email")}:</span>{" "}
                      {selectedSub.email}
                    </p>
                    <p>
                      <span className="font-semibold">{t("address")}:</span>{" "}
                      {selectedSub.street}, {selectedSub.zip} {selectedSub.city}
                      , {selectedSub.country}
                    </p>
                    {selectedSub.phone && (
                      <p>
                        <span className="font-semibold">{t("phone")}:</span>{" "}
                        {selectedSub.phone}
                      </p>
                    )}
                    {selectedSub.message && (
                      <p className="italic text-gray-600 dark:text-gray-400">
                        {selectedSub.message}
                      </p>
                    )}

                    {/* Premio para el pagador: Si NO es regalo O si es regalo y giftDelivery === "to_payer" */}
                    {selectedSub.gift &&
                      (!selectedSub.isGift ||
                        selectedSub.giftDelivery === "to_payer") && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                          <p className="flex items-start gap-2">
                            <span className="font-semibold">
                              {t("reward")}:
                            </span>
                            <span className="flex-1">
                              🏅 {selectedSub.gift.name}
                              <span className="block text-xs text-gray-500 mt-1">
                                {t("rewardForPayer") ||
                                  "Prämie für den Abonnenten"}
                              </span>
                            </span>
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Detalles del Abo */}
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">{t("type")}:</span>{" "}
                      {selectedSub.type}
                    </p>
                    <p>
                      <span className="font-semibold">{t("format")}:</span>{" "}
                      {selectedSub.format}
                    </p>
                    {selectedSub.donationExtra && (
                      <p>
                        <span className="font-semibold">{t("donation")}:</span>{" "}
                        {selectedSub.donationExtra} €
                      </p>
                    )}
                    <p>
                      <span className="font-semibold">{t("gift")}:</span>{" "}
                      {selectedSub.isGift ? `🎁 ${t("yes")}` : "—"}
                    </p>
                    {selectedSub.isGift &&
                      selectedSub.giftSubscriptionDuration && (
                        <p>
                          <span className="font-semibold">
                            {t("giftSubscriptionDuration")}:
                          </span>{" "}
                          {selectedSub.giftSubscriptionDuration === "ONE_YEAR"
                            ? t("oneYear")
                            : t("untilCancelled")}
                        </p>
                      )}
                  </div>
                </div>

                {/* Si es regalo, mostrar bloque separado del DESTINATARIO */}
                {selectedSub.isGift && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                      {t("giftRecipient")}
                    </h3>

                    <div className="space-y-2">
                      <p>
                        <span className="font-semibold">
                          {t("giftRecipientName")}:
                        </span>{" "}
                        {selectedSub.giftRecipientName}
                      </p>

                      <p>
                        <span className="font-semibold">
                          {t("giftRecipientEmail")}:
                        </span>{" "}
                        {selectedSub.giftRecipientEmail}
                      </p>

                      <p>
                        <span className="font-semibold">
                          {t("giftRecipientAddress")}:
                        </span>{" "}
                        {selectedSub.giftRecipientStreet},{" "}
                        {selectedSub.giftRecipientZip}{" "}
                        {selectedSub.giftRecipientCity},{" "}
                        {selectedSub.giftRecipientCountry}
                      </p>

                      {/* Premio SOLO si giftDelivery === "to_recipient" */}
                      {selectedSub.gift &&
                        selectedSub.giftDelivery === "to_recipient" && (
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                            <p className="flex items-start gap-2">
                              <span className="font-semibold">
                                {t("reward")}:
                              </span>
                              <span className="flex-1">
                                🎁 {selectedSub.gift.name}
                                <span className="block text-xs text-gray-500 mt-1">
                                  {t("rewardForRecipient") ||
                                    "Prämie für den Geschenkempfänger"}
                                </span>
                              </span>
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                )}
                {/* Estado de procesamiento */}
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-right">
                  {selectedSub.isNew ? (
                    <button
                      onClick={async () => {
                        if (
                          !confirm("¿Marcar esta suscripción como procesada?")
                        )
                          return;

                        try {
                          const res = await fetch(
                            `/api/subscriptions/${selectedSub.id}`,
                            {
                              method: "PATCH",
                            }
                          );

                          if (!res.ok)
                            throw new Error(
                              "Error al actualizar la suscripción"
                            );

                          alert("✅ Suscripción marcada como procesada");
                          setShowModal(false);

                          const updatedRes = await fetch("/api/subscriptions");
                          const updatedData = await updatedRes.json();
                          setSubscriptions(updatedData.subscriptions || []);
                        } catch (err) {
                          console.error(
                            "❌ Error al actualizar suscripción:",
                            err
                          );
                          alert("❌ No se pudo actualizar la suscripción");
                        }
                      }}
                      className="px-5 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                    >
                      {t("markProcessed")}
                    </button>
                  ) : (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      ✅{" "}
                      <span className="font-semibold">
                        {t("processedLabel")}
                      </span>{" "}
                      {new Date(selectedSub.updatedAt).toLocaleDateString(
                        "es-ES",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

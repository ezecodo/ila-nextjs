"use client";

import { useEffect, useState, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { useTranslations } from "next-intl";

export default function OrdersPage() {
  const t = useTranslations("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef(null);

  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    const measureHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
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

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Error cargando pedidos");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("❌ Error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  async function openOrderDetails(id) {
    try {
      const url = `${window.location.origin}/api/orders/${String(id)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Error cargando pedido");
      const data = await res.json();
      setSelectedOrder(data);
      setShowModal(true);
    } catch (err) {
      console.error("❌ Error en openOrderDetails:", err);
    }
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.firstName.toLowerCase().includes(search.toLowerCase()) ||
      o.lastName.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <p className="text-center text-gray-500">{t("loading")}</p>;
  }

  return (
    <>
      <div ref={headerRef} className="absolute top-0 left-0 w-full -z-10" />

      <div className="max-w-7xl mx-auto py-6 px-4 md:py-10 md:px-6">
        {/* Header con búsqueda */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
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

        {/* ── Mobile: cards ───────────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {order.isNew ? (
                      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                      </span>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 opacity-80 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {order.firstName} {order.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {order.email}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "Item" : "Items"}
                  </span>
                  {order.recipients?.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                      {t("addressesBadge", { count: order.recipients.length + 1 })}
                    </span>
                  )}
                  <button
                    onClick={() => openOrderDetails(order.id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition"
                  >
                    {t("viewDetails")}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t("noResults")}
            </p>
          )}
        </div>

        {/* ── Desktop: tabla ──────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto rounded-lg shadow-lg">
          <table className="w-full border-collapse bg-white dark:bg-gray-900 text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">
                <th className="px-5 py-3 text-left">{t("date")}</th>
                <th className="px-5 py-3 text-left">{t("customer")}</th>
                <th className="px-5 py-3 text-left">{t("email")}</th>
                <th className="px-5 py-3 text-center">{t("items")}</th>
                <th className="px-5 py-3 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-5 py-3 flex items-center gap-2">
                    {order.isNew ? (
                      <span className="relative flex h-3 w-3 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                      </span>
                    ) : (
                      <span className="relative flex h-3 w-3 mr-1">
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 opacity-80" />
                      </span>
                    )}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">
                    {order.firstName} {order.lastName}
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                    {order.email}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      {order.items.length}
                    </span>
                    {order.recipients?.length > 0 && (
                      <span className="ml-2 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        {t("addressesBadge", { count: order.recipients.length + 1 })}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => openOrderDetails(order.id)}
                      className="px-4 py-2 text-xs font-semibold rounded-md bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm transition"
                    >
                      {t("viewDetails")}
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
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
        {showModal && selectedOrder && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4"
            style={{ marginTop: `${headerHeight}px` }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto mx-4 relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-50 text-gray-500 hover:text-red-600 transition-all duration-200 text-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                aria-label="Schließen"
                title="Schließen"
              >
                ✕
              </button>

              <div className="p-6 md:p-8 pt-12">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
                  {t("orderFrom")} {selectedOrder.firstName}{" "}
                  {selectedOrder.lastName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Info cliente */}
                  <div className="space-y-3">
                    <p>
                      <span className="font-semibold">{t("clientEmail")}:</span>{" "}
                      {selectedOrder.email}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t("clientAddress")}:
                      </span>{" "}
                      {selectedOrder.street}, {selectedOrder.zip}{" "}
                      {selectedOrder.city}, {selectedOrder.country}
                    </p>
                    {selectedOrder.phone && (
                      <p>
                        <span className="font-semibold">
                          {t("clientPhone")}:
                        </span>{" "}
                        {selectedOrder.phone}
                      </p>
                    )}
                    {selectedOrder.message && (
                      <p className="italic text-gray-600 dark:text-gray-400">
                        "{selectedOrder.message}"
                      </p>
                    )}
                    {/* Botón + textarea de respuesta */}
                    {selectedOrder.message && (
                      <div className="mt-4">
                        {!showReplyBox && (
                          <button
                            onClick={() => setShowReplyBox(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                          >
                            Responder mensaje
                          </button>
                        )}

                        {showReplyBox && (
                          <div className="mt-4 space-y-3">
                            <textarea
                              className="w-full border border-gray-300 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800 text-sm"
                              rows={5}
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Escribe tu respuesta…"
                            />

                            <div className="flex gap-3">
                              <button
                                onClick={async () => {
                                  if (!replyMessage.trim()) {
                                    alert("El mensaje no puede estar vacío");
                                    return;
                                  }

                                  try {
                                    const res = await fetch(
                                      "/api/orders/reply",
                                      {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          to: selectedOrder.email,
                                          message: replyMessage,
                                          subject:
                                            "Antwort zu Ihrer ila-Bestellung",
                                        }),
                                      }
                                    );

                                    if (!res.ok)
                                      throw new Error(
                                        "Error enviando respuesta"
                                      );

                                    alert("✔️ Respuesta enviada correctamente");
                                    setReplyMessage("");
                                    setShowReplyBox(false);
                                  } catch (err) {
                                    console.error(err);
                                    alert("❌ No se pudo enviar la respuesta");
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                              >
                                Enviar respuesta
                              </button>

                              <button
                                onClick={() => {
                                  setReplyMessage("");
                                  setShowReplyBox(false);
                                }}
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {t("requestedItems")}
                    </h3>
                    {selectedOrder.recipients?.length > 0 ? (
                      <div className="space-y-4">
                        {/* Items para el comprador */}
                        {(() => {
                          const buyerItems = selectedOrder.items.filter(
                            (i) => !i.recipientId
                          );
                          if (buyerItems.length === 0) return null;
                          return (
                            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                              <h4 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">
                                {t("buyerShipmentTitle")}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {selectedOrder.firstName} {selectedOrder.lastName} ·{" "}
                                {selectedOrder.street}, {selectedOrder.zip}{" "}
                                {selectedOrder.city}, {selectedOrder.country}
                              </p>
                              <ul className="space-y-1">
                                {buyerItems.map((item) => (
                                  <li key={item.id} className="text-sm">
                                    <span className="font-medium">
                                      ila {item.edition.number}:
                                    </span>{" "}
                                    {item.edition.title}
                                    <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold">
                                      x{item.qty}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}

                        {/* Items para cada destinatario alternativo */}
                        {selectedOrder.recipients.map((rec, idx) => {
                          const recItems = selectedOrder.items.filter(
                            (i) => i.recipientId === rec.id
                          );
                          return (
                            <div
                              key={rec.id}
                              className="border border-blue-200 dark:border-blue-900 rounded-md p-3 bg-blue-50 dark:bg-blue-950/20"
                            >
                              <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-2">
                                {t("recipientShipmentTitle", { n: idx + 1 })}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {rec.salutation ? `${rec.salutation} ` : ""}
                                {rec.firstName} {rec.lastName}
                                {rec.institution ? ` · ${rec.institution}` : ""}
                                <br />
                                {rec.street}
                                {rec.addressExtra ? `, ${rec.addressExtra}` : ""},{" "}
                                {rec.zip} {rec.city}, {rec.country}
                                {rec.phone ? ` · Tel.: ${rec.phone}` : ""}
                              </p>
                              <ul className="space-y-1">
                                {recItems.map((item) => (
                                  <li key={item.id} className="text-sm">
                                    <span className="font-medium">
                                      ila {item.edition.number}:
                                    </span>{" "}
                                    {item.edition.title}
                                    <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                                      x{item.qty}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {selectedOrder.items.map((item) => (
                          <li
                            key={item.id}
                            className="p-3 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                          >
                            <span className="font-medium">
                              ila {item.edition.number}:
                            </span>{" "}
                            {item.edition.title}
                            <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold">
                              x{item.qty}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {/* Estado de procesamiento */}
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-right">
                  {selectedOrder.isNew ? (
                    <button
                      onClick={async () => {
                        if (!confirm("¿Marcar este pedido como procesado?"))
                          return;

                        try {
                          const res = await fetch(
                            `/api/orders/${selectedOrder.id}`,
                            {
                              method: "PATCH",
                            }
                          );

                          if (!res.ok)
                            throw new Error("Error al actualizar el pedido");

                          alert("✅ Pedido marcado como procesado");

                          setShowModal(false);

                          const updatedRes = await fetch("/api/orders");
                          const updatedData = await updatedRes.json();
                          setOrders(updatedData.orders || []);
                        } catch (err) {
                          console.error("❌ Error al actualizar pedido:", err);
                          alert("❌ No se pudo actualizar el pedido");
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
                      {new Date(selectedOrder.updatedAt).toLocaleDateString(
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

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

  useEffect(() => {
    // Función para medir la altura del header
    const measureHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    // Medir inicialmente y cuando cambie el tamaño de la ventana
    measureHeaderHeight();
    window.addEventListener("resize", measureHeaderHeight);

    // También usar MutationObserver para detectar cambios en el DOM del header
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
        setOrders(data.orders || []); // ✅ solo el array de pedidos
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
      {/* Referencia invisible para medir el header */}
      <div ref={headerRef} className="absolute top-0 left-0 w-full -z-10" />

      <div className="max-w-7xl mx-auto py-10 px-6">
        {/* Header con búsqueda */}
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
                  <td className="px-5 py-3">
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

        {/* Modal con altura dinámica */}
        {showModal && selectedOrder && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4"
            style={{ marginTop: `${headerHeight}px` }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto mx-4 relative">
              {/* Botón de cerrar - MEJORADO */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-50 text-gray-500 hover:text-red-600 transition-all duration-200 text-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105"
                aria-label="Schließen"
                title="Schließen"
              >
                ✕
              </button>

              <div className="p-6 md:p-8 pt-12">
                {" "}
                {/* Añadí pt-12 para espacio extra arriba */}
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
                      {selectedOrder.street}, {selectedOrder.city},{" "}
                      {selectedOrder.country}
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
                        “{selectedOrder.message}”
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {t("requestedItems")}
                    </h3>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

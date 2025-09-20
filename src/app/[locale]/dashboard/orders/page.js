"use client";

import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null); // 👉 aquí guardamos el pedido abierto
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Error cargando pedidos");
        const data = await res.json();
        setOrders(data);
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

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error cargando pedido: ${errText}`);
      }

      const data = await res.json();
      setSelectedOrder(data);
      setShowModal(true);
    } catch (err) {
      console.error("❌ Error en openOrderDetails:", err);
    }
  }

  if (loading) return <p className="text-center">Cargando pedidos...</p>;

  if (orders.length === 0) {
    return <p className="text-center">No hay pedidos todavía.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">📦 Pedidos</h1>
      <table className="w-full border border-gray-300 dark:border-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-left">
            <th className="p-2 border">Fecha</th>
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Items</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <td className="p-2 border">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="p-2 border">
                {order.firstName} {order.lastName}
              </td>
              <td className="p-2 border">{order.email}</td>
              <td className="p-2 border">{order.items.length}</td>
              <td className="p-2 border">
                <button
                  onClick={() => openOrderDetails(order.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 🔹 Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
              ✖
            </button>

            <h2 className="text-xl font-bold mb-4">
              Pedido de {selectedOrder.firstName} {selectedOrder.lastName}
            </h2>

            <p>
              <strong>Email:</strong> {selectedOrder.email}
            </p>
            <p>
              <strong>Dirección:</strong> {selectedOrder.street},{" "}
              {selectedOrder.city}, {selectedOrder.country}
            </p>

            <h3 className="text-lg font-semibold mt-4 mb-2">Items</h3>
            <ul className="list-disc list-inside">
              {selectedOrder.items.map((item) => (
                <li key={item.id}>
                  ila {item.edition.number}: {item.edition.title} – Cantidad:{" "}
                  {item.qty}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

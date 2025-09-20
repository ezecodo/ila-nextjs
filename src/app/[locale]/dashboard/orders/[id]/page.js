"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error cargando pedido:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p className="p-6">Cargando...</p>;
  if (!order) return <p className="p-6">No se encontró el pedido.</p>;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-2xl w-full relative">
        {/* Botón cerrar */}
        <button
          onClick={() => router.back()}
          className="absolute top-3 right-3 text-gray-600 hover:text-red-600"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-4">Detalle del Pedido</h2>

        <p>
          <strong>Nombre:</strong> {order.firstName} {order.lastName}
        </p>
        <p>
          <strong>Email:</strong> {order.email}
        </p>
        <p>
          <strong>Dirección:</strong> {order.street}, {order.city} {order.zip},{" "}
          {order.country}
        </p>
        {order.phone && (
          <p>
            <strong>Teléfono:</strong> {order.phone}
          </p>
        )}
        {order.message && (
          <p>
            <strong>Mensaje:</strong> {order.message}
          </p>
        )}

        <h3 className="text-xl font-semibold mt-6 mb-2">Artículos</h3>
        <ul className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <li key={item.id} className="py-2">
              <strong>Edición:</strong> {item.editionId} —{" "}
              <strong>Cantidad:</strong> {item.qty}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-gray-500">
          Pedido creado el {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

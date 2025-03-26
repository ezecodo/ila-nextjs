import { useState, useEffect } from "react";
import Link from "next/link";

const GenericAdminList = ({
  title,
  endpoint,
  columns,
  editUrlPrefix,
  editPath = "",
  deleteUrlPrefix,
  itemName = "elemento",
  onItemDeleted, // ✅ nuevo prop para actualizar stats
}) => {
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const limit = 20;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("admin", "true");
        url.searchParams.set("page", page);
        url.searchParams.set("limit", limit);
        url.searchParams.set("sortField", sortField);
        url.searchParams.set("sortOrder", sortOrder);

        const res = await fetch(url.toString());
        const data = await res.json();

        if (Array.isArray(data.items)) {
          setItems(data.items);
          setTotalPages(data.totalPages || 1);
        } else {
          throw new Error(
            "La respuesta no contiene un array válido en `items`"
          );
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [endpoint, page, sortField, sortOrder]);

  const handleSort = (field) => {
    setSortOrder(
      sortField === field ? (sortOrder === "asc" ? "desc" : "asc") : "asc"
    );
    setSortField(field);
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const res = await fetch(`${deleteUrlPrefix}/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (res.status === 204 || res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
        setShowModal(false);
        setItemToDelete(null);

        if (onItemDeleted) {
          onItemDeleted();
        }

        return;
      }

      // Si el servidor responde con error, intentamos mostrar el mensaje
      let message = "Error al eliminar el elemento.";
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.error) {
          message = data.error;
        }
      }

      throw new Error(message);
    } catch (err) {
      console.error("🔥 Error al eliminar:", err);
      alert(err.message || "Error al eliminar el elemento.");
    }
  };

  if (loading) return <p className="text-gray-500">Cargando datos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="relative mt-6 bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-purple-600">
        {title}
      </h2>

      {items.length === 0 ? (
        <p className="text-center text-gray-500">
          No se encontraron resultados.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse shadow-md text-sm">
              <thead>
                <tr className="bg-purple-600 text-white text-xs">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="p-1.5 border cursor-pointer text-left"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label} ⬍
                    </th>
                  ))}
                  <th className="p-1.5 border text-left">✏️ Editar</th>
                  {deleteUrlPrefix && (
                    <th className="p-1.5 border text-left">🗑️ Eliminar</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`text-gray-700 text-xs ${
                      index % 2 === 0 ? "bg-gray-100" : "bg-white"
                    } hover:bg-purple-100`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-1.5 border">
                        {col.format ? col.format(item[col.key]) : item[col.key]}
                      </td>
                    ))}
                    <td className="p-1.5 border text-center">
                      <Link href={`${editUrlPrefix}/${item.id}${editPath}`}>
                        <button className="text-blue-600 hover:underline">
                          ✏️ Editar
                        </button>
                      </Link>
                    </td>
                    {deleteUrlPrefix && (
                      <td className="p-1.5 border text-center">
                        <button
                          onClick={() => confirmDelete(item)}
                          className="text-red-500 hover:underline"
                        >
                          ❌
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              ⬅️ Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Siguiente ➡️
            </button>
          </div>
        </>
      )}

      {/* 🔥 Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <h3 className="text-lg font-bold text-red-600 mb-3">
              ¿Eliminar este {itemName}?
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Esta acción no se puede deshacer. ¿Estás seguro que querés
              eliminar este {itemName}?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericAdminList;

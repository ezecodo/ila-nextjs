import { useState, useEffect } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

const GenericAdminListDossiers = ({
  endpoint,
  columns,
  editUrlPrefix,
  deleteUrlPrefix,
  itemName = "dossier",
  onItemDeleted,
  extraQuery = {},
  defaultSortField = "id",
  defaultSortOrder = "desc",
  mode = "admin",
}) => {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState(defaultSortField || "id");
  const [sortOrder, setSortOrder] = useState(defaultSortOrder || "desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const t = useTranslations("dossiers");
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

        Object.entries(extraQuery || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== null && String(v) !== "") {
            url.searchParams.set(k, String(v));
          }
        });

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
        setError(t("editionsError"));
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [endpoint, page, sortField, sortOrder, JSON.stringify(extraQuery)]);

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

        if (onItemDeleted) onItemDeleted();
        return;
      }

      let message = "Error al eliminar el dossier.";
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (data?.error) message = data.error;
      }
      throw new Error(message);
    } catch (err) {
      console.error("🔥 Error al eliminar:", err);
      alert(err.message || "Error al eliminar el dossier.");
    }
  };

  if (loading)
    return (
      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
        {t("loadingEditions") || "Cargando dossiers..."}
      </p>
    );
  if (error) return <p className="text-red-500 text-center py-4">{error}</p>;

  return (
    <div className="w-full py-6 -mx-2">
      {" "}
      {/* ✅ Cambiado: w-full en lugar de max-w-7xl */}
      {items.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-6">
          {t("noEditions") || "No hay dossiers disponibles"}
        </p>
      ) : (
        <>
          {/* Tabla con estética moderna - ahora ocupará todo el ancho */}
          <div className="overflow-x-auto rounded-lg shadow-lg min-w-max">
            <table className="w-max border-collapse bg-white dark:bg-gray-900 text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-5 py-3 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition whitespace-nowrap"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.label} ⬍
                    </th>
                  ))}
                  <th className="px-5 py-3 text-center">
                    {mode === "reviewer"
                      ? t("actions") || "Acciones"
                      : mode === "translator"
                        ? t("translate") || "Traducir"
                        : t("edit")}
                  </th>
                  {deleteUrlPrefix && (
                    <th className="px-5 py-3 text-center">{t("delete")}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-5 py-3 text-gray-900 dark:text-gray-100 whitespace-normal"
                      >
                        {col.format
                          ? col.format(item[col.key], item, (updatedItem) => {
                              // ✅ Actualizar solo la fila actual sin recargar
                              setItems((prev) =>
                                prev.map((i) =>
                                  i.id === item.id ? updatedItem : i
                                )
                              );
                            })
                          : item[col.key]}
                      </td>
                    ))}
                    <td className="px-5 py-3 text-center">
                      {mode === "translator" ? (
                        // 🟢 Vista del traductor: botón "Traducir"
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/editions/translate/${item.id}`
                            )
                          }
                          className="text-green-600 hover:underline font-semibold"
                        >
                          {t("translate") || "Traducir"}
                        </button>
                      ) : mode === "reviewer" ? (
                        // 🟣 Vista del revisor/admin
                        item.translationStatus === "submitted" ? (
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/editions/translate/${item.id}?mode=review`
                              )
                            }
                            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700"
                          >
                            {t("review") || "Revisar"}
                          </button>
                        ) : // 🟡 Si está asignado o en progreso → mostrar "En progreso"
                        ["assigned", "in_progress"].includes(
                            item.translationStatus
                          ) ? (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-yellow-100 text-yellow-800">
                            {t("inProgress") || "En progreso"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-gray-100 text-gray-800">
                            {item.translationStatus || "—"}
                          </span>
                        )
                      ) : (
                        // 🔵 Vista admin normal: botón Editar
                        <button
                          onClick={() =>
                            router.push(`${editUrlPrefix}/${item.id}`)
                          }
                          className="text-blue-600 hover:underline"
                        >
                          {t("edit")}
                        </button>
                      )}
                    </td>
                    {deleteUrlPrefix && (
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => confirmDelete(item)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          {t("delete")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex justify-between items-center mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 transition"
            >
              ⬅️ {t("prevPage") || "Anterior"}
            </button>
            <span className="text-gray-700 dark:text-gray-300">
              {t("page") || "Página"} {page} {t("of") || "de"} {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 transition"
            >
              {t("nextPage") || "Siguiente"} ➡️
            </button>
          </div>
        </>
      )}
      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              {t("confirmDelete") || "Confirmar eliminación"}
            </h3>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
              {t("confirmDeleteDetail") ||
                `Esta acción no se puede deshacer. ¿Estás seguro que quieres eliminar este ${itemName}?`}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              >
                {t("cancel") || "Cancelar"}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t("delete") || "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericAdminListDossiers;

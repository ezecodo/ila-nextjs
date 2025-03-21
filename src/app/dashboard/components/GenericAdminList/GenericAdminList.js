import { useState, useEffect } from "react";
import Link from "next/link";

const GenericAdminList = ({ title, endpoint, columns, editUrlPrefix }) => {
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const limit = 20;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        // 🧠 Construcción segura de la URL
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("admin", "true");
        url.searchParams.set("page", page);
        url.searchParams.set("limit", limit);
        url.searchParams.set("sortField", sortField);
        url.searchParams.set("sortOrder", sortOrder);

        const res = await fetch(url.toString());
        const data = await res.json();
        console.log("🧪 Datos recibidos:", data);

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

  if (loading) return <p className="text-gray-500">Cargando datos...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-lg">
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
                      <Link href={`${editUrlPrefix}/${item.id}`}>
                        <button className="text-blue-600 hover:underline">
                          ✏️ Editar
                        </button>
                      </Link>
                    </td>
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
    </div>
  );
};

export default GenericAdminList;

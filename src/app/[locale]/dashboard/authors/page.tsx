"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl"; // <--- IMPORTANTE: AÑADIDO ESTE
import IlaLoader from "../../components/IlaLoader/IlaLoader";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaMapMarkerAlt,
  FaEnvelope,
  FaUserAlt,
} from "react-icons/fa";

interface Author {
  id: number;
  name: string;
  email: string | null;
  bio: string | null;
  location: string | null;
  role: string | null;
  _count?: {
    articles: number;
  };
}

export default function AuthorsManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale(); // <--- IMPORTANTE: AÑADIDO ESTO
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Author>>({});
  const [saving, setSaving] = useState(false);

  // Verificar acceso admin
  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  // Cargar autores
  useEffect(() => {
    fetch("/api/authors")
      .then((res) => res.json())
      .then((data) => {
        setAuthors(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando autores:", err);
        setLoading(false);
      });
  }, []);

  const filteredAuthors = authors.filter((author) =>
    author.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (author: Author) => {
    setEditingId(author.id);
    setEditForm({
      name: author.name,
      email: author.email || "",
      bio: author.bio || "",
      location: author.location || "",
      role: author.role || "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (id: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setAuthors((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
        );
        setEditingId(null);
        setEditForm({});
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error guardando:", err);
      alert("Error al guardar");
    }
    setSaving(false);
  };

  const handleDelete = async (author: Author) => {
    if (
      !confirm(
        `¿Eliminar a "${author.name}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/authors/${author.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAuthors((prev) => prev.filter((a) => a.id !== author.id));
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("Error al eliminar");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <IlaLoader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Autores
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Administra colaboradores y redactores del contenido.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-shadow shadow-sm"
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Total de Autores Registrados
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {authors.length}
          </p>
        </div>
        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200">
          <FaUserAlt />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Autor
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Contacto
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">
                  Ubicación
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
                  Estado
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAuthors.map((author) => (
                <tr
                  key={author.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150"
                >
                  {editingId === author.id ? (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={editForm.name || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="block w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-gray-500">
                          <FaEnvelope className="text-xs" />
                          <input
                            type="email"
                            value={editForm.email || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-gray-500">
                          <FaMapMarkerAlt className="text-xs" />
                          <input
                            type="text"
                            value={editForm.location || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                location: e.target.value,
                              })
                            }
                            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Editando...
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSave(author.id)}
                            disabled={saving}
                            className="p-2 text-white bg-green-600 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Guardar"
                          >
                            <FaSave size={14} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 text-white bg-gray-500 rounded-full hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            title="Cancelar"
                          >
                            <FaTimes size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {getInitials(author.name)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {author.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {author.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <FaEnvelope className="text-gray-400 text-xs" />
                          {author.email || (
                            <span className="italic text-gray-400">
                              No especificado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <FaMapMarkerAlt className="text-gray-400 text-xs" />
                          {author.location || (
                            <span className="italic text-gray-400">
                              Desconocida
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                            author._count?.articles === 0
                              ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                              : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                          }`}
                        >
                          {author._count?.articles || 0}{" "}
                          {locale === "es" ? "arts." : "Art."}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(author)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(author)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredAuthors.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    No se encontraron autores con ese nombre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

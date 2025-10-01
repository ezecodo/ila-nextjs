"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import AssignTranslatorCell from "./AssignTranslatorCell";
import { useSession } from "next-auth/react";

/**
 * Props:
 * - mode: "admin" | "reviewer" (por defecto "admin")
 *   - admin  -> tu lista actual sin cambios
 *   - reviewer -> filtra por artículos asignados al revisor y muestra acciones Aprobar/Rechazar
 */
const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

const ArticlesList = ({ mode = "admin" }) => {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const limit = 20;
  const locale = useLocale();
  const { data: session } = useSession();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [selectedEdition, setSelectedEdition] = useState("");
  const [editions, setEditions] = useState([]);

  useEffect(() => {
    async function fetchEditions() {
      try {
        const res = await fetch("/api/editions");
        const data = await res.json();
        setEditions(data);
      } catch (err) {
        console.error("❌ Error cargando ediciones:", err);
      }
    }
    fetchEditions();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const base = `/api/articles/list`;
        const searchParams = new URLSearchParams();

        // paginación y orden
        searchParams.append("page", page);
        searchParams.append("limit", limit);
        searchParams.append("sortField", sortField);
        searchParams.append("sortOrder", sortOrder);
        // 🔒 Filtro por usuario traductor
        if (mode === "translator" && session?.user?.id) {
          searchParams.append("translatorId", session.user.id);
        }

        // 📌 Modo asignación (solo artículos sin traductor)
        if (mode === "assign") {
          searchParams.append("unassigned", "true");
        }

        // 👁️ Modo revisor (si lo usas)
        if (mode === "reviewer") {
          searchParams.append("reviewer", "true");
        }

        // 👇 NUEVO filtro por dossier
        if (selectedEdition) {
          if (selectedEdition === "nur-online") {
            searchParams.append("nurOnline", "true");
          } else if (selectedEdition === "unpublished") {
            searchParams.append("unpublished", "true");
          } else if (selectedEdition === "assigned") {
            searchParams.append("assigned", "true");
          } else if (selectedEdition === "translated") {
            searchParams.append("translated", "true");
          } else {
            searchParams.append("editionId", selectedEdition);
          }
        }

        const response = await fetch(`${base}?${searchParams.toString()}`);
        if (!response.ok) throw new Error("Error al obtener artículos");
        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error cargando artículos:", error);
      }
    };

    if (mode === "translator" && !session?.user?.id) return;
    fetchArticles();
  }, [page, sortField, sortOrder, mode, session?.user?.id, selectedEdition]); // 👈 añadimos selectedEdition

  const handleSort = (field) => {
    // En modo reviewer puedes seguir ordenando si tu API lo soporta; si no, puedes early-return aquí.
    setSortOrder(
      sortField === field ? (sortOrder === "asc" ? "desc" : "asc") : "asc"
    );
    setSortField(field);
  };

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-red-600">
        📄 Lista de Artículos
        {mode === "reviewer" && " — Para Revisar"}
        {mode === "assign" && " — Sin Traductor"}
      </h2>
      {mode !== "translator" && (
        <div className="mb-4 flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">
            Filtrar por Dossier:
          </label>
          <select
            value={selectedEdition}
            onChange={(e) => setSelectedEdition(e.target.value)}
            className="p-2 border rounded text-sm"
          >
            <option value="">-- Todos --</option>
            <option value="nur-online">🌐 Nur Online</option>
            <option value="unpublished">❌ Nicht veröffentlicht</option>
            {mode === "assign" && (
              <>
                <option value="assigned">👤 Asignados</option>
                <option value="translated">🌐 Traducidos</option>
              </>
            )}
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.title} (N° {ed.number})
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse shadow-md text-sm">
          <thead>
            <tr className="bg-red-600 text-white text-xs">
              <th
                className="p-1.5 border cursor-pointer text-left"
                onClick={() => handleSort("id")}
              >
                ID ⬍
              </th>
              <th
                className="p-1.5 border cursor-pointer text-center"
                onClick={() => handleSort("isPublished")}
                title={locale === "de" ? "Veröffentlicht" : "Publicado"}
              >
                📢
              </th>
              <th
                className="p-1.5 border cursor-pointer text-left"
                onClick={() => handleSort("title")}
              >
                Título ⬍
              </th>
              {mode === "reviewer" && (
                <th className="p-1.5 border text-left">Traductor</th>
              )}
              {mode === "reviewer" && (
                <th className="p-1.5 border text-left">Estado</th>
              )}

              {/* Columnas solo para admin (tu lista original) */}
              {mode === "admin" && (
                <>
                  <th
                    className="p-1.5 border cursor-pointer text-left"
                    onClick={() => handleSort("authors")}
                  >
                    Autor ⬍
                  </th>
                  <th
                    className="p-1.5 border cursor-pointer text-left"
                    onClick={() => handleSort("categories")}
                  >
                    Categoría ⬍
                  </th>
                  <th
                    className="p-1.5 border cursor-pointer text-left"
                    onClick={() => handleSort("publicationDate")}
                  >
                    📅 Publicación ⬍
                  </th>
                  <th
                    className="p-1.5 border cursor-pointer text-left"
                    onClick={() => handleSort("edition")}
                  >
                    📚 Edición ⬍
                  </th>
                  <th className="p-1.5 border text-center" title="Imagen">
                    🖼️
                  </th>
                  <th className="p-1.5 border text-left">✏️ Editar</th>
                  <th className="p-1.5 border text-left">🗑️ </th>
                </>
              )}

              <th className="p-1.5 border text-left">
                {mode === "reviewer" ? "Acciones" : "🌐 Tra"}
              </th>
            </tr>
          </thead>

          <tbody>
            {articles.map((article, index) => (
              <tr
                key={article.id}
                className={`text-gray-700 text-xs ${
                  index % 2 === 0 ? "bg-gray-100" : "bg-white"
                } hover:bg-red-100`}
              >
                <td className="p-1.5 border">{article.id}</td>
                <td className="p-1.5 border text-center">
                  {article.isPublished ? (
                    <span
                      title={locale === "de" ? "Veröffentlicht" : "Publicado"}
                    >
                      ✅
                    </span>
                  ) : (
                    <span
                      title={
                        locale === "de"
                          ? "Nicht veröffentlicht"
                          : "No publicado"
                      }
                    >
                      ❌
                    </span>
                  )}
                </td>

                <td className="p-1.5 border">
                  <Link
                    href={
                      article.legacyPath
                        ? `/${locale}${article.legacyPath}`
                        : `/${locale}/articles/${article.id}`
                    }
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    {locale === "es" && article.isTranslatedES
                      ? article.titleES || article.title
                      : article.title}
                  </Link>
                </td>
                {mode === "reviewer" && (
                  <td className="p-1.5 border text-center text-xs">
                    {article.translator ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {article.translator.name || article.translator.email}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        Sin traductor
                      </span>
                    )}
                  </td>
                )}
                {mode === "reviewer" && (
                  <td className="p-1.5 border text-center text-xs">
                    {article.translationStatus === "submitted" ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                        Enviado
                      </span>
                    ) : article.translationStatus === "approved" ? (
                      <span className="px-2 py-0.5 bg-green-200 text-green-900 rounded-full">
                        Revisado
                        {article.reviewedAt
                          ? ` — ${formatDateTime(article.reviewedAt)}`
                          : ""}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                        En progreso
                      </span>
                    )}
                  </td>
                )}
                {/* 👇 Aquí añadimos la celda de traductor, solo en modo reviewer */}

                {mode === "admin" && (
                  <>
                    <td className="p-1.5 border">
                      {article.authors.map((a) => a.name).join(", ")}
                    </td>
                    <td className="p-1.5 border">
                      {article.categories.map((c) => c.name).join(", ")}
                    </td>
                    <td className="p-1.5 border">
                      {article.publicationDate
                        ? new Date(article.publicationDate).toLocaleDateString(
                            "es-ES"
                          )
                        : "Sin fecha"}
                    </td>
                    <td className="p-1.5 border">
                      {article.edition
                        ? `${article.edition.title} (N° ${article.edition.number})`
                        : "Sin edición"}
                    </td>
                    <td className="p-1.5 border text-center">
                      {article.images && article.images.length > 0
                        ? "✔️"
                        : "❌"}
                    </td>
                    <td className="p-1.5 border text-center">
                      <Link href={`/dashboard/articles/edit/${article.id}`}>
                        <button className="text-blue-600 hover:underline">
                          ✏️ Editar
                        </button>
                      </Link>
                    </td>
                    <td className="p-1.5 border text-center">
                      <button
                        onClick={() => {
                          setArticleToDelete(article);
                          setIsDeleteOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                        title="Eliminar artículo"
                      >
                        ❌
                      </button>
                    </td>
                  </>
                )}

                <td className="p-1.5 border text-center">
                  {mode === "assign" && selectedEdition === "translated" ? (
                    // Vista "Traducidos" → solo nombre + fecha
                    article.translator ? (
                      <div className="flex flex-col items-center text-xs">
                        <span className="px-2 py-0.5 bg-gray-200 rounded-full text-gray-800">
                          {article.translator.name || article.translator.email}
                        </span>
                        {article.assignedAt && (
                          <span className="text-gray-500 text-[11px]">
                            {new Date(article.assignedAt).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">
                        Sin traductor
                      </span>
                    )
                  ) : mode === "assign" ? (
                    // Vista "Asignar traducciones" normal
                    article.translator ? (
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-gray-200 rounded-full text-gray-800">
                          {article.translator.name || article.translator.email}
                        </span>
                        {article.assignedAt && (
                          <span className="text-gray-500 text-[11px]">
                            {new Date(article.assignedAt).toLocaleDateString(
                              "es-ES"
                            )}
                          </span>
                        )}
                        <AssignTranslatorCell
                          article={article}
                          onAssigned={(updated) => {
                            setArticles((prev) =>
                              prev.map((a) =>
                                a.id === updated.id
                                  ? {
                                      ...a,
                                      translator: updated.translator,
                                      assignedAt: updated.assignedAt,
                                    }
                                  : a
                              )
                            );
                          }}
                        />
                      </div>
                    ) : (
                      <AssignTranslatorCell
                        article={article}
                        onAssigned={(updated) => {
                          setArticles((prev) =>
                            prev.map((a) =>
                              a.id === updated.id
                                ? {
                                    ...a,
                                    translator: updated.translator,
                                    assignedAt: updated.assignedAt,
                                  }
                                : a
                            )
                          );
                        }}
                      />
                    )
                  ) : mode === "reviewer" ? (
                    article.translationStatus === "submitted" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/articles/translate/${article.id}?mode=review`}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                          title="Revisar traducción"
                        >
                          👁️ Revisar
                        </Link>
                      </div>
                    ) : article.translationStatus === "approved" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/articles/translate/${article.id}?mode=review`}
                          className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                          title="Revisar nuevamente"
                        >
                          🔁 Volver a revisar
                        </Link>
                      </div>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        En progreso
                      </span>
                    )
                  ) : article.isTranslatedES ? (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Check
                        className="w-4 h-4 text-green-600"
                        title="Traducido"
                      />
                      {article.needsReviewES ? (
                        // 👇 Ocultar "Revisión" para traductor
                        mode === "translator" ? null : (
                          <Link
                            href={`/dashboard/articles/translate/${article.id}?mode=review`}
                            className="text-yellow-500 text-[10px] hover:underline"
                          >
                            Revisión
                          </Link>
                        )
                      ) : (
                        <Check
                          className="w-4 h-4 text-yellow-500"
                          title="Revisado"
                        />
                      )}
                    </div>
                  ) : article.translationStatus === "in_progress" ? (
                    mode === "translator" || mode === "admin" ? (
                      <Link
                        href={`/dashboard/articles/translate/${article.id}`}
                      >
                        <button className="text-green-600 hover:underline text-sm">
                          🌐 Traducir
                        </button>
                      </Link>
                    ) : (
                      <span className="text-gray-400" title="En traducción">
                        🌐
                      </span>
                    )
                  ) : (
                    <Link href={`/dashboard/articles/translate/${article.id}`}>
                      <button className="text-green-600 hover:underline text-sm">
                        🌐 Traducir
                      </button>
                    </Link>
                  )}
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
      {/* 👇 Modal de confirmación */}
      {isDeleteOpen && articleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              ¿De veras quieres eliminar este artículo?
            </h3>
            <p className="mb-4 text-sm text-gray-700">
              <span className="block">
                <strong>Título:</strong> {articleToDelete.title}
              </span>
              <span className="block">
                <strong>ID:</strong> {articleToDelete.id}
              </span>
              {articleToDelete.edition && (
                <span className="block">
                  <strong>Dossier:</strong> {articleToDelete.edition.number}
                </span>
              )}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `/api/articles/${articleToDelete.id}`,
                      {
                        method: "DELETE",
                      }
                    );
                    if (!res.ok) throw new Error("Error al eliminar");
                    setArticles((prev) =>
                      prev.filter((a) => a.id !== articleToDelete.id)
                    );
                    setIsDeleteOpen(false);
                    setArticleToDelete(null);
                  } catch (err) {
                    console.error(err);
                    alert("Error al eliminar artículo");
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlesList;

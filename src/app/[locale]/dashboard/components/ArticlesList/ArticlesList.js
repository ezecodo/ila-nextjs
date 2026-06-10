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

const ArticlesList = ({ mode = "admin", initialFilter = "" }) => {
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
  const [editPickerId, setEditPickerId] = useState(null);
  const isSuperAdmin = session?.user?.email === "e.zeangeloni@gmail.com";
  const [selectedEdition, setSelectedEdition] = useState(initialFilter);
  const [editions, setEditions] = useState([]);
  const [selectedBeitragstyp, setSelectedBeitragstyp] = useState("");
  const [beitragstypen, setBeitragstypen] = useState([]);

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
    async function fetchBeitragstypen() {
      try {
        const res = await fetch("/api/beitragstypen");
        const data = await res.json();
        setBeitragstypen(data);
      } catch (err) {
        console.error("❌ Error cargando tipos:", err);
      }
    }
    fetchEditions();
    fetchBeitragstypen();
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

        // 📌 Modo asignación: por defecto solo artículos sin traductor,
        // salvo cuando el filtro pide ver los ya asignados o traducidos.
        if (
          mode === "assign" &&
          selectedEdition !== "assigned" &&
          selectedEdition !== "translated"
        ) {
          searchParams.append("unassigned", "true");
        }

        // 👁️ Modo revisor (si lo usas)
        if (mode === "reviewer") {
          searchParams.append("reviewer", "true");
        }

        // Filtro por tipo de artículo
        if (selectedBeitragstyp) {
          searchParams.append("beitragstypId", selectedBeitragstyp);
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
  }, [page, sortField, sortOrder, mode, session?.user?.id, selectedEdition, selectedBeitragstyp]);

  const handleSort = (field) => {
    setSortOrder(
      sortField === field ? (sortOrder === "asc" ? "desc" : "asc") : "asc"
    );
    setSortField(field);
  };

  return (
    <div className="w-full py-6">
      {mode !== "translator" && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Dossier:
            </label>
            <select
              value={selectedEdition}
              onChange={(e) => { setSelectedEdition(e.target.value); setPage(1); }}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">-- Alle --</option>
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Tipo:
            </label>
            <select
              value={selectedBeitragstyp}
              onChange={(e) => { setSelectedBeitragstyp(e.target.value); setPage(1); }}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">-- Alle --</option>
              {beitragstypen.map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tabla con estética moderna */}
      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full border-collapse bg-white dark:bg-gray-900 text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">
              <th
                className="px-5 py-3 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                onClick={() => handleSort("id")}
              >
                ID ⬍
              </th>
              <th
                className="px-5 py-3 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                onClick={() => handleSort("isPublished")}
                title={locale === "de" ? "Veröffentlicht" : "Publicado"}
              >
                📢
              </th>
              <th
                className="px-5 py-3 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                onClick={() => handleSort("title")}
              >
                Título ⬍
              </th>
              {mode === "reviewer" && (
                <>
                  <th className="px-5 py-3 text-left">Autor</th>
                  <th className="px-5 py-3 text-left">Edición</th>
                </>
              )}
              {mode === "assign" && (
                <>
                  <th className="px-5 py-3 text-left">Autor</th>
                  <th className="px-5 py-3 text-left">Edición</th>
                </>
              )}
              {mode === "reviewer" && (
                <>
                  <th className="px-5 py-3 text-left">Autor</th>
                  <th className="px-5 py-3 text-left">Edición</th>
                </>
              )}
              {mode === "reviewer" && (
                <th className="px-5 py-3 text-left">Traductor</th>
              )}
              {mode === "reviewer" && (
                <th className="px-5 py-3 text-left">Estado</th>
              )}

              {/* Columnas solo para admin */}
              {mode === "admin" && (
                <>
                  <th
                    className="px-5 py-3 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition whitespace-nowrap"
                    onClick={() => handleSort("authors")}
                  >
                    Autor ⬍
                  </th>
                  <th
                    className="px-5 py-3 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition whitespace-nowrap"
                    onClick={() => handleSort("categories")}
                  >
                    Categoría ⬍
                  </th>
                  <th
                    className="px-5 py-3 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition whitespace-nowrap"
                    onClick={() => handleSort("publicationDate")}
                  >
                    📅 Publicación ⬍
                  </th>
                  <th
                    className="px-5 py-3 text-left cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition whitespace-nowrap"
                    onClick={() => handleSort("edition")}
                  >
                    📚 Edición ⬍
                  </th>
                  <th className="px-5 py-3 text-center" title="Imagen">
                    🖼️
                  </th>
                  <th className="px-5 py-3 text-center">Editar</th>
                  <th className="px-5 py-3 text-center">Eliminar</th>
                </>
              )}

              <th className="px-5 py-3 text-center">
                {mode === "reviewer" ? "Acciones" : "🌐 Tra"}
              </th>
            </tr>
          </thead>

          <tbody>
            {articles.map((article) => (
              <tr
                key={article.id}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                  {article.id}
                </td>
                <td className="px-5 py-3 text-center">
                  {article.isPublished ? (
                    <span
                      title={locale === "de" ? "Veröffentlicht" : "Publicado"}
                      className="text-green-600"
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
                      className="text-red-600"
                    >
                      ❌
                    </span>
                  )}
                </td>

                <td className="px-5 py-3">
                  <Link
                    href={
                      article.legacyPath
                        ? `/${locale}${article.legacyPath}`
                        : `/${locale}/articles/${article.id}`
                    }
                    className="text-blue-600 hover:underline font-medium"
                    target="_blank"
                  >
                    {locale === "es" && article.isTranslatedES
                      ? article.titleES || article.title
                      : article.title}
                  </Link>
                </td>

                {mode === "reviewer" && (
                  <>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.authors.map((a) => a.name).join(", ")}
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.edition
                        ? `${article.edition.title} (N° ${article.edition.number})`
                        : "Sin edición"}
                    </td>
                  </>
                )}

                {mode === "reviewer" && (
                  <td className="px-5 py-3 text-center">
                    {article.translator ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {article.translator.name || article.translator.email}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        Sin traductor
                      </span>
                    )}
                  </td>
                )}

                {mode === "reviewer" && (
                  <td className="px-5 py-3 text-center">
                    {article.translationStatus === "submitted" ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Enviado
                      </span>
                    ) : article.translationStatus === "approved" &&
                      article.editedAfterReview ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        ✏️ Editado tras revisión
                      </span>
                    ) : article.translationStatus === "approved" ? (
                      <span className="px-2 py-1 bg-green-200 text-green-900 rounded-full text-xs">
                        Revisado
                        {article.reviewedAt
                          ? ` — ${formatDateTime(article.reviewedAt)}`
                          : ""}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        En progreso
                      </span>
                    )}
                  </td>
                )}

                {mode === "assign" && (
                  <>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.authors.map((a) => a.name).join(", ")}
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.edition
                        ? `${article.edition.title} (N° ${article.edition.number})`
                        : "Sin edición"}
                    </td>
                  </>
                )}
                {mode === "admin" && (
                  <>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.authors.map((a) => a.name).join(", ")}
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.categories.map((c) => c.name).join(", ")}
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.publicationDate
                        ? new Date(article.publicationDate).toLocaleDateString(
                            "es-ES"
                          )
                        : "Sin fecha"}
                    </td>
                    <td className="px-5 py-3 text-gray-900 dark:text-gray-100">
                      {article.edition
                        ? `${article.edition.title} (N° ${article.edition.number})`
                        : "Sin edición"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {article.images && article.images.length > 0 ? (
                        <span className="text-green-600">✔️</span>
                      ) : (
                        <span className="text-red-600">❌</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {isSuperAdmin ? (
                        <button onClick={() => setEditPickerId(article.id)} className="text-blue-600 hover:underline">
                          Editar
                        </button>
                      ) : (
                        <Link href={`/${locale}/dashboard/articles/edit/${article.id}`}>
                          <button className="text-blue-600 hover:underline">Editar</button>
                        </Link>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => {
                          setArticleToDelete(article);
                          setIsDeleteOpen(true);
                        }}
                        className="text-red-600 hover:text-red-800 font-bold"
                        title="Eliminar artículo"
                      >
                        Eliminar
                      </button>
                    </td>
                  </>
                )}

                <td className="px-5 py-3 text-center">
                  {mode === "assign" && selectedEdition === "translated" ? (
                    article.translator ? (
                      <div className="flex flex-col items-center text-xs">
                        <span className="px-2 py-1 bg-gray-200 rounded-full text-gray-800">
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
                    article.translator ? (
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-gray-200 rounded-full text-gray-800">
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
                          className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          title="Revisar traducción"
                        >
                          👁️ Revisar
                        </Link>
                      </div>
                    ) : article.translationStatus === "approved" ? (
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/articles/translate/${article.id}?mode=review`}
                          className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          title="Revisar nuevamente"
                        >
                          🔁 Revisar
                        </Link>
                      </div>
                    ) : (
                      <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg">
                        En progreso
                      </span>
                    )
                  ) : article.isTranslatedES ? (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <Check
                        className="w-4 h-4 text-green-600"
                        title="Traducido"
                      />
                      {article.needsReviewES ? (
                        mode === "translator" ? null : (
                          <Link
                            href={`/dashboard/articles/translate/${article.id}?mode=review`}
                            className="text-yellow-500 text-[10px] hover:underline"
                          >
                            Revisión
                          </Link>
                        )
                      ) : article.editedAfterReview ? (
                        mode === "translator" ? (
                          <Check
                            className="w-4 h-4 text-yellow-500"
                            title="Revisado"
                          />
                        ) : (
                          <Link
                            href={`/dashboard/articles/translate/${article.id}?mode=review`}
                            className="text-blue-500 text-[10px] hover:underline"
                            title="Editado tras revisión"
                          >
                            ✏️ Editado
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

      {/* Paginación */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 transition"
        >
          ⬅️ Anterior
        </button>
        <span className="text-gray-700 dark:text-gray-300">
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 disabled:opacity-50 transition"
        >
          Siguiente ➡️
        </button>
      </div>

      {/* Modal de confirmación */}
      {isDeleteOpen && articleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              ¿De veras quieres eliminar este artículo?
            </h3>
            <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
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
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor picker — solo para super admin */}
      {editPickerId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setEditPickerId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">¿Con qué editor?</h3>
            <p className="text-xs text-gray-500 mb-5">Artículo #{editPickerId}</p>
            <div className="flex flex-col gap-3">
              <Link href={`/${locale}/dashboard/articles/edit-v2/${editPickerId}`} onClick={() => setEditPickerId(null)}>
                <button className="w-full px-4 py-3 bg-[#BD0E0D] hover:bg-[#a50c0b] text-white font-bold rounded-lg text-sm transition">
                  ✏️ Nuevo editor (v2)
                </button>
              </Link>
              <Link href={`/${locale}/dashboard/articles/edit/${editPickerId}`} onClick={() => setEditPickerId(null)}>
                <button className="w-full px-4 py-3 border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm transition">
                  Editor clásico
                </button>
              </Link>
            </div>
            <button onClick={() => setEditPickerId(null)} className="mt-4 text-xs text-gray-400 hover:text-gray-600 w-full text-center">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticlesList;

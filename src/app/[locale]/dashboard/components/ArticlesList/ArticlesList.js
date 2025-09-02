import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";

const ArticlesList = () => {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("desc");
  const limit = 20;
  const locale = useLocale();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          `/api/articles/list?page=${page}&limit=${limit}&sortField=${sortField}&sortOrder=${sortOrder}`
        );
        if (!response.ok) throw new Error("Error al obtener artículos");
        const data = await response.json();
        setArticles(data.articles);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error("Error cargando artículos:", error);
      }
    };

    fetchArticles();
  }, [page, sortField, sortOrder]);

  const handleSort = (field) => {
    setSortOrder(
      sortField === field ? (sortOrder === "asc" ? "desc" : "asc") : "asc"
    );
    setSortField(field);
  };

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-red-600">
        📄 Lista de Artículos
      </h2>

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
                className="p-1.5 border cursor-pointer text-left"
                onClick={() => handleSort("title")}
              >
                Título ⬍
              </th>
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
              <th className="p-1.5 border text-left">📷 Imagen</th>
              <th className="p-1.5 border text-left">✏️ Editar</th>
              <th className="p-1.5 border text-left">🌐 Tra</th>
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
                  {article.images && article.images.length > 0 ? "✔️" : "❌"}
                </td>
                <td className="p-1.5 border text-center">
                  <Link href={`/dashboard/articles/edit/${article.id}`}>
                    <button className="text-blue-600 hover:underline">
                      ✏️ Editar
                    </button>
                  </Link>
                </td>
                <td className="p-1.5 border text-center">
                  {article.isTranslatedES ? (
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      {/* ✅ Traducido */}
                      <Check
                        className="w-4 h-4 text-green-600"
                        title="Traducido"
                      />

                      {article.needsReviewES ? (
                        // Enlace para revisar si aún no fue revisado
                        <Link
                          href={`/dashboard/articles/translate/${article.id}?mode=review`}
                          className="text-yellow-500 text-[10px] hover:underline"
                        >
                          Revisión
                        </Link>
                      ) : (
                        // ✅ en amarillo si ya fue revisado
                        <Check
                          className="w-4 h-4 text-yellow-500"
                          title="Revisado"
                        />
                      )}
                    </div>
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
    </div>
  );
};

export default ArticlesList;

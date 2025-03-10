import { useState, useEffect } from "react";

const ArticlesList = () => {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(
          `/api/articles/list?page=${page}&limit=${limit}`
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
  }, [page]);

  return (
    <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">📄 Lista de Artículos</h2>

      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Título</th>
            <th className="p-2 border">Autor</th>
            <th className="p-2 border">Categoría</th>
            <th className="p-2 border">📅 Publicación</th>
            <th className="p-2 border">📚 Edición</th>
            <th className="p-2 border">📷 Imagen</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.id} className="text-center">
              <td className="p-2 border">{article.id}</td>
              <td className="p-2 border">{article.title}</td>
              <td className="p-2 border">
                {article.authors.map((a) => a.name).join(", ")}
              </td>
              <td className="p-2 border">
                {article.categories.map((c) => c.name).join(", ")}
              </td>
              {/* ✅ Nueva columna: Fecha de publicación */}
              <td className="p-2 border">
                {article.publicationDate
                  ? new Date(article.publicationDate).toLocaleDateString(
                      "es-ES"
                    )
                  : "Sin fecha"}
              </td>
              {/* ✅ Nueva columna: Edición */}
              <td className="p-2 border">
                {article.edition
                  ? `${article.edition.title} (N° ${article.edition.number})`
                  : "Sin edición"}
              </td>
              <td className="p-2 border">
                {article.images.length > 0 ? "✔️" : "❌"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="p-2 bg-gray-300 rounded disabled:opacity-50"
        >
          ⬅️ Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="p-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Siguiente ➡️
        </button>
      </div>
    </div>
  );
};

export default ArticlesList;

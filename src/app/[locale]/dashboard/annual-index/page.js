"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AnnualIndexDashboard() {
  const { status } = useSession();
  const router = useRouter();

  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [titleES, setTitleES] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Verificar autenticación
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Cargar registros
  useEffect(() => {
    fetchRegistros();
  }, []);

  async function fetchRegistros() {
    try {
      const res = await fetch("/api/annual-index");
      const data = await res.json();
      setRegistros(data);
    } catch (err) {
      console.error("Error cargando registros:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!file) {
      setError("Selecciona un archivo PDF");
      return;
    }

    if (!year || year < 1980 || year > 2100) {
      setError("Año inválido");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("year", year);
      if (title) formData.append("title", title);
      if (titleES) formData.append("titleES", titleES);

      const res = await fetch("/api/annual-index/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error subiendo archivo");
      }

      setSuccess(`Registro ${year} subido correctamente`);

      // Limpiar formulario
      setYear("");
      setTitle("");
      setTitleES("");
      setFile(null);
      document.getElementById("fileInput").value = "";

      // Recargar lista
      fetchRegistros();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id, year) {
    if (!confirm(`¿Eliminar el registro del año ${year}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/annual-index/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error eliminando registro");
      }

      setSuccess(`Registro ${year} eliminado`);
      fetchRegistros();
    } catch (err) {
      setError(err.message);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Annual Index
          </h1>
          <p className="text-gray-600">
            Sube y gestiona los registros anuales en PDF
          </p>
        </div>

        {/* Formulario de Upload */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Subir nuevo registro
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Año */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="1980"
                  max="2100"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="2026"
                />
              </div>

              {/* Título (Alemán) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título (DE) <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Jahresregister 2026"
                />
              </div>
            </div>

            {/* Título español */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título (ES) <span className="text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={titleES}
                onChange={(e) => setTitleES(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Registro Anual 2026"
              />
            </div>

            {/* Archivo PDF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archivo PDF <span className="text-red-500">*</span>
              </label>
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full md:w-auto px-6 py-3 bg-[#BD0E0D] text-white font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? "Subiendo..." : "Subir Registro"}
            </button>
          </form>
        </div>

        {/* Lista de Registros */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Registros existentes ({registros.length})
          </h2>

          {registros.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay registros todavía
            </p>
          ) : (
            <div className="space-y-3">
              {registros.map((registro) => (
                <div
                  key={registro.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl font-bold text-[#BD0E0D]">
                        {registro.year}
                      </span>
                      {registro.title && (
                        <span className="text-gray-700 font-medium">
                          {registro.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{registro.fileName}</span>
                      {registro.fileSize && (
                        <span>
                          {(registro.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                      <span>
                        {new Date(registro.uploadedAt).toLocaleDateString(
                          "es-ES",
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botón Ver/Descargar - ✅ CORREGIDO */}
                    <a
                      href={registro.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Ver
                    </a>

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => handleDelete(registro.id, registro.year)}
                      className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

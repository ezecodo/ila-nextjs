"use client";

import { useState } from "react";

export default function TestUploadPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-local", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setIsLoading(false);

    if (res.ok) {
      setResult(data);
    } else {
      setError(data.error || "Error desconocido");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white border border-gray-200">
      <h1 className="text-xl font-bold mb-1">🧪 Test Upload Local</h1>
      <p className="text-sm text-gray-500 mb-6">
        Página temporal para probar el upload al servidor Hetzner. Borrar cuando esté confirmado.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm text-gray-600 border border-gray-300 p-2"
          required
        />
        <button
          type="submit"
          disabled={isLoading || !file}
          className="w-full bg-[#d13120] hover:bg-[#b82a1b] disabled:opacity-50 text-white py-2 text-sm font-semibold uppercase tracking-wider transition-colors"
        >
          {isLoading ? "Subiendo..." : "Subir imagen"}
        </button>
      </form>

      {error && (
        <div className="mt-4 border-l-4 border-[#d13120] bg-red-50 px-4 py-3 text-sm text-red-700">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="border-l-4 border-green-500 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✅ Archivo subido correctamente
          </div>
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Filename:</span> {result.filename}</p>
            <p><span className="font-semibold">URL:</span>{" "}
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-[#d13120] underline break-all">
                {result.url}
              </a>
            </p>
          </div>
          {result.url && (
            <img
              src={result.url}
              alt="Preview"
              className="mt-2 max-w-full border border-gray-200"
            />
          )}
        </div>
      )}
    </div>
  );
}

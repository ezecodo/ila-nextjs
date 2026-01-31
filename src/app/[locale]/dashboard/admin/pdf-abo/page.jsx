"use client";

import React, { useState, useEffect } from "react";
import {
  FaEnvelope,
  FaUpload,
  FaTrash,
  FaCheck,
  FaClock,
  FaPaperPlane,
  FaFileUpload,
  FaSearch,
  FaTimes,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa";

export default function PdfAboAdmin() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "redeemed"

  // Cargar invitaciones
  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/admin/pdf-abo-invitations");
      const data = await res.json();
      setInvitations(data);
    } catch (error) {
      console.error("Error al cargar invitaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  // Añadir email individual
  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const res = await fetch("/api/admin/pdf-abo-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase() }),
      });

      if (res.ok) {
        setNewEmail("");
        fetchInvitations();
        setShowAddModal(false);
      } else {
        const error = await res.json();
        alert(error.message || "Error al añadir email");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al añadir email");
    }
  };

  // Subir CSV
  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await fetch("/api/admin/pdf-abo-invitations/upload-csv", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        alert(
          `Se añadieron ${result.added} emails. ${result.duplicates} ya existían.`,
        );
        setCsvFile(null);
        fetchInvitations();
      } else {
        alert("Error al procesar el archivo CSV");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al subir el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  // Eliminar invitación
  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar esta invitación?")) return;

    try {
      const res = await fetch(`/api/admin/pdf-abo-invitations/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchInvitations();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Reenviar invitación
  const handleResend = async (id, email) => {
    try {
      const res = await fetch(`/api/admin/pdf-abo-invitations/${id}/resend`, {
        method: "POST",
      });

      if (res.ok) {
        alert(`Email de invitación reenviado a ${email}`);
      } else {
        alert("Error al reenviar email");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al reenviar email");
    }
  };

  // Filtrar invitaciones
  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch = inv.email
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !inv.isRedeemed) ||
      (filter === "redeemed" && inv.isRedeemed);
    return matchesSearch && matchesFilter;
  });

  // Estadísticas
  const stats = {
    total: invitations.length,
    pending: invitations.filter((i) => !i.isRedeemed).length,
    redeemed: invitations.filter((i) => i.isRedeemed).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">
          Gestión de PDF ABO
        </h1>
        <p className="text-zinc-400">
          Administra las invitaciones para suscriptores de PDF
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FaUsers className="text-blue-500 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-zinc-400">Total invitaciones</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <FaClock className="text-yellow-500 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-sm text-zinc-400">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FaUserCheck className="text-green-500 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.redeemed}</p>
              <p className="text-sm text-zinc-400">Activados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
        >
          <FaEnvelope />
          Añadir Email
        </button>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-colors cursor-pointer border border-zinc-700">
            <FaFileUpload />
            {csvFile ? csvFile.name : "Seleccionar CSV"}
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          {csvFile && (
            <button
              onClick={handleCsvUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <FaUpload />
              )}
              Subir
            </button>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
          />
        </div>

        <div className="flex gap-2">
          {["all", "pending", "redeemed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                filter === f
                  ? "bg-red-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {f === "all" && "Todos"}
              {f === "pending" && "Pendientes"}
              {f === "redeemed" && "Activados"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de invitaciones */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">
                  Estado
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">
                  Fecha inicio
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-zinc-400">
                  Activado
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-zinc-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvitations.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-zinc-500"
                  >
                    No se encontraron invitaciones
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-white">{inv.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      {inv.isRedeemed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          <FaCheck className="text-xs" />
                          Activado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                          <FaClock className="text-xs" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {new Date(inv.startDate).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {inv.redeemedAt
                        ? new Date(inv.redeemedAt).toLocaleDateString("de-DE")
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!inv.isRedeemed && (
                          <button
                            onClick={() => handleResend(inv.id, inv.email)}
                            className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Reenviar invitación"
                          >
                            <FaPaperPlane />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para añadir email */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Añadir Email</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddEmail}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email del suscriptor
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                >
                  Añadir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

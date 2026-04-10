"use client";

import React, { useState, useEffect } from "react";
import DossiersSection from "./DossiersSection";
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
  FaInbox,
} from "react-icons/fa";
// IMPORTA TU SISTEMA DE TRADUCCIÓN AQUÍ.
// Ejemplo para next-intl:
import { useTranslations, useLocale } from "next-intl";

// Definición de colores personalizados
const BRAND_RED = "#BD0E0D";
const BRAND_RED_HOVER = "#A30C0B";
const BRAND_GREEN = "#89B881";
const BRAND_GREEN_HOVER = "#76A36F";

export default function PdfAboAdmin() {
  // Hook de traducción apuntando al namespace 'pdf_abo'
  const t = useTranslations("pdf_abo");
  // Hook para obtener el idioma actual ('es' o 'de') para las fechas
  const locale = useLocale();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toasts, setToasts] = useState([]);

  const showToast = (key, type = "success", values = {}) => {
    const id = Date.now();
    // Usamos la función de traducción para los mensajes dinámicos
    const message = t(key, values);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

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
      showToast("toasts.load_error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const res = await fetch("/api/admin/pdf-abo-invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase(), name: newName.trim() || null }),
      });

      if (res.ok) {
        setNewEmail("");
        setNewName("");
        fetchInvitations();
        setShowAddModal(false);
        showToast("toasts.added");
      } else {
        showToast("toasts.add_error", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("toasts.connection_error", "error");
    }
  };

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
        showToast("toasts.csv_success", "success", {
          added: result.added,
          duplicates: result.duplicates,
        });
        setCsvFile(null);
        fetchInvitations();
      } else {
        showToast("toasts.csv_error", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("toasts.csv_error", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("toasts.confirm_delete"))) return;
    try {
      const res = await fetch(`/api/admin/pdf-abo-invitations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchInvitations();
        showToast("toasts.deleted");
      } else {
        showToast("toasts.delete_error", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("toasts.connection_error", "error");
    }
  };

  const handleResend = async (id, email) => {
    try {
      const res = await fetch(`/api/admin/pdf-abo-invitations/${id}/resend`, {
        method: "POST",
      });
      if (res.ok) {
        showToast("toasts.resend_success", "success", { email });
      } else {
        showToast("toasts.resend_error", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("toasts.connection_error", "error");
    }
  };

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

  const stats = {
    total: invitations.length,
    pending: invitations.filter((i) => !i.isRedeemed).length,
    redeemed: invitations.filter((i) => i.isRedeemed).length,
  };

  // Configuración de fechas dinámica según el idioma
  const dateOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 bg-gray-50">
        <div
          className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4"
          style={{ borderColor: BRAND_RED, borderTopColor: "transparent" }}
        ></div>
        <p className="text-gray-500 font-medium animate-pulse">
          {t("loading")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800 font-sans selection:bg-red-100">
      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto transform transition-all duration-300 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border-l-4 min-w-[320px] bg-white
              ${
                toast.type === "error"
                  ? "border-red-500 text-gray-800"
                  : "border-[#89B881] text-gray-800"
              }`}
          >
            <div
              className={`p-1.5 rounded-full ${toast.type === "error" ? "bg-red-100 text-red-600" : "bg-[#89B881]/20 text-[#89B881]"}`}
            >
              {toast.type === "error" ? <FaTimes /> : <FaCheck />}
            </div>
            <p className="text-sm font-medium text-gray-700">{toast.message}</p>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-gray-200">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 tracking-tight">
            {t("header.title")}{" "}
            <span style={{ color: BRAND_RED }}>
              {t("header.title").split(" ").pop()}
            </span>
          </h1>
          <p className="text-gray-500 text-lg">{t("header.subtitle")}</p>
        </div>

        {/* Estadísticas - Versión Compacta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                <FaUsers className="text-lg" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  {t("stats.total")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                <FaClock className="text-lg" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600/80 uppercase tracking-wider">
                  {t("stats.pending")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          {/* Activados */}
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg text-[#89B881]"
                style={{ backgroundColor: "#89B88115" }}
              >
                <FaUserCheck className="text-lg" />
              </div>
              <div>
                <p
                  className="text-sm font-medium uppercase tracking-wider opacity-80"
                  style={{ color: "#89B881" }}
                >
                  {t("stats.redeemed")}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.redeemed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between sticky top-4 z-30 shadow-sm">
          <div className="relative w-full lg:w-1/2">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t("filters.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#BD0E0D] focus:ring-1 focus:ring-[#BD0E0D] transition-all"
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
            {["all", "pending", "redeemed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  filter === f
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white"
                }`}
                style={{
                  backgroundColor: filter === f ? BRAND_RED : "transparent",
                }}
              >
                {t(`filters.${f}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            style={{ backgroundColor: BRAND_RED }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = BRAND_RED_HOVER)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = BRAND_RED)
            }
          >
            <FaEnvelope className="group-hover:scale-110 transition-transform" />
            {t("actions.add_email")}
          </button>

          <div className="flex bg-white border border-gray-200 rounded-xl p-1.5 items-center overflow-hidden shadow-sm">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-sm font-medium overflow-hidden whitespace-nowrap">
              <FaFileUpload />
              {csvFile
                ? csvFile.name.substring(0, 25) +
                  (csvFile.name.length > 25 ? "..." : "")
                : t("actions.select_csv")}
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
                className="h-full px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                style={{ backgroundColor: BRAND_GREEN }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = BRAND_GREEN_HOVER)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = BRAND_GREEN)
                }
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t("actions.uploading")}
                  </>
                ) : (
                  <>
                    <FaUpload /> {t("actions.upload_csv")}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4">{t("table.th_name")}</th>
                  <th className="px-6 py-4">{t("table.th_email")}</th>
                  <th className="px-6 py-4">{t("table.th_status")}</th>
                  <th className="px-6 py-4">{t("table.th_date_inv")}</th>
                  <th className="px-6 py-4">{t("table.th_date_act")}</th>
                  <th className="px-6 py-4 text-right">
                    {t("table.th_actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvitations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                        <div className="p-4 bg-gray-50 rounded-full">
                          <FaInbox className="text-3xl opacity-50" />
                        </div>
                        <p className="font-medium text-gray-500">
                          {t("table.empty_title")}
                        </p>
                        <p className="text-sm">{t("table.empty_desc")}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvitations.map((inv) => (
                    <tr
                      key={inv.id}
                      className="group hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <span className="text-gray-700">
                          {inv.name || <span className="text-gray-400 italic">—</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {inv.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.isRedeemed ? (
                          <span
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm"
                            style={{
                              backgroundColor: `${BRAND_GREEN}15`,
                              color: BRAND_GREEN,
                            }}
                          >
                            <FaCheck className="text-[10px]" />
                            {t("table.status_active")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-yellow-50 text-yellow-700 border border-yellow-100">
                            <FaClock className="text-[10px]" />
                            {t("table.status_pending")}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(inv.startDate).toLocaleDateString(
                          locale === "es" ? "es-ES" : "de-DE",
                          dateOptions,
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {inv.redeemedAt
                          ? new Date(inv.redeemedAt).toLocaleDateString(
                              locale === "es" ? "es-ES" : "de-DE",
                              dateOptions,
                            )
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {!inv.isRedeemed && (
                            <button
                              onClick={() => handleResend(inv.id, inv.email)}
                              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title={t("actions.resend")}
                            >
                              <FaPaperPlane />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-2.5 text-gray-400 hover:text-white rounded-lg transition-all duration-200 hover:bg-red-600"
                            title={t("actions.delete")}
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
      </div>

      {/* ── Sección Dossiers PDF ─────────────────────────────── */}
      <DossiersSection />

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity opacity-100 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {t("modal.title")}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setNewName(""); setNewEmail(""); }}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAddEmail} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modal.label_name")}
                </label>
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("modal.placeholder_name")}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#BD0E0D] focus:ring-1 focus:ring-[#BD0E0D] transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("modal.label")}
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t("modal.placeholder")}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#BD0E0D] focus:ring-1 focus:ring-[#BD0E0D] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  {t("modal.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
                  style={{ backgroundColor: BRAND_RED }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = BRAND_RED_HOVER)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = BRAND_RED)
                  }
                >
                  {t("modal.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

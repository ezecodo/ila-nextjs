"use client";
import { useEffect, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";

export default function TranslatorsAdminPage() {
  const [translators, setTranslators] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Formulario de alta
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  // Habilitar admin para traducir
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [enabling, setEnabling] = useState(false);

  // Modal de confirmación + aviso in-page
  const [confirmState, setConfirmState] = useState(null);
  const [notice, setNotice] = useState(null);

  const showNotice = (type, text) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [resList, resAdmins] = await Promise.all([
        fetch("/api/users?assignable=1&withStats=1"),
        fetch("/api/users?role=admin"),
      ]);
      if (!resList.ok) throw new Error("No se pudieron cargar los traductores");
      const dataList = await resList.json();
      const dataAdmins = resAdmins.ok ? await resAdmins.json() : { users: [] };
      setTranslators(dataList.users || []);
      setAdmins(dataAdmins.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormMsg(null);
    if (!newEmail.trim()) return;
    try {
      setCreating(true);
      const res = await fetch("/api/admin/translators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo dar de alta");
      setFormMsg({
        type: "ok",
        text: data.promoted
          ? "Usuario existente promovido a traductor/a. Verá las herramientas de traducción la próxima vez que inicie sesión."
          : "Traductor/a invitado/a. Se envió el email para definir contraseña.",
      });
      setNewName("");
      setNewEmail("");
      await loadAll();
    } catch (err) {
      setFormMsg({ type: "err", text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleEnableAdmin = async () => {
    if (!selectedAdminId) return;
    try {
      setEnabling(true);
      const res = await fetch(`/api/admin/translators/${selectedAdminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canTranslate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo habilitar");
      setSelectedAdminId("");
      await loadAll();
      showNotice("ok", "Admin habilitado/a para traducir.");
    } catch (err) {
      showNotice("err", err.message);
    } finally {
      setEnabling(false);
    }
  };

  const handleDisableAdmin = (user) => {
    setConfirmState({
      title: "Quitar de traducción",
      message: `¿Quitar a ${user.name || user.email} de traducción? Seguirá siendo admin, solo dejará de aparecer como asignable.`,
      confirmText: "Sí, quitar",
      tone: "danger",
      action: async () => {
        setBusyId(user.id);
        const res = await fetch(`/api/admin/translators/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canTranslate: false }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo quitar");
        setTranslators((prev) => prev.filter((u) => u.id !== user.id));
        await loadAll();
        showNotice("ok", `${user.name || user.email} ya no aparece como traductor/a.`);
      },
    });
  };

  const handleResend = async (user) => {
    try {
      setBusyId(user.id);
      const res = await fetch(`/api/admin/translators/${user.id}/resend`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "No se pudo reenviar");
      showNotice("ok", "Invitación reenviada.");
    } catch (err) {
      showNotice("err", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleSendReset = (user) => {
    setConfirmState({
      title: "Restablecer contraseña",
      message: `¿Enviar a ${user.name || user.email} un email para restablecer su contraseña?`,
      confirmText: "Enviar email",
      tone: "default",
      action: async () => {
        setBusyId(user.id);
        const res = await fetch(
          `/api/admin/translators/${user.id}/reset-password`,
          { method: "POST" }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo enviar");
        showNotice("ok", "Email de restablecimiento enviado.");
      },
    });
  };

  const handleRemove = (user) => {
    setConfirmState({
      title: "Quitar del equipo de traducción",
      message: `¿Quitar a ${user.name || user.email} del equipo de traducción? Pasará a ser usuario normal (conserva acceso a su panel de usuario) y su nombre seguirá figurando en los artículos que ya tradujo.`,
      confirmText: "Sí, quitar",
      tone: "danger",
      action: async () => {
        setBusyId(user.id);
        const res = await fetch(`/api/admin/translators/${user.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "No se pudo quitar");
        setTranslators((prev) => prev.filter((u) => u.id !== user.id));
        showNotice(
          "ok",
          `${user.name || user.email} pasó a usuario normal. El cambio se aplica cuando vuelva a iniciar sesión.`
        );
      },
    });
  };

  const runConfirm = async () => {
    if (!confirmState?.action) return;
    try {
      await confirmState.action();
      setConfirmState(null);
    } catch (err) {
      setConfirmState(null);
      showNotice("err", err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = translators.filter((u) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      u.name?.toLowerCase().includes(needle) ||
      u.email?.toLowerCase().includes(needle) ||
      u.username?.toLowerCase().includes(needle)
    );
  });

  const availableAdmins = admins.filter((a) => !a.canTranslate);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-gray-100">
        🌐 Traductores
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {translators.length} en la lista de traducción
      </p>

      {/* Alta de traductor */}
      <form
        onSubmit={handleCreate}
        className="mb-4 flex flex-wrap items-end gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800/40"
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Nombre y apellido
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Karla Rubio"
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="karla@ejemplo.com"
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-[#BD0E0D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a50c0b] transition-colors disabled:opacity-50"
        >
          {creating ? "Enviando…" : "➕ Nuevo traductor"}
        </button>
        {formMsg && (
          <span
            className={`text-sm ${
              formMsg.type === "ok" ? "text-green-600" : "text-red-600"
            }`}
          >
            {formMsg.text}
          </span>
        )}
      </form>

      {/* Habilitar un admin para traducir */}
      <div className="mb-8 flex flex-wrap items-end gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800/40">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Habilitar un admin para traducir
          </label>
          <select
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 min-w-[240px]"
          >
            <option value="">— Elegí un admin —</option>
            {availableAdmins.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name || a.email}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleEnableAdmin}
          disabled={enabling || !selectedAdminId}
          className="rounded-md border border-[#BD0E0D] px-4 py-2 text-sm font-semibold text-[#BD0E0D] hover:bg-[#BD0E0D] hover:text-white transition-colors disabled:opacity-50"
        >
          {enabling ? "Habilitando…" : "Habilitar"}
        </button>
        {availableAdmins.length === 0 && (
          <span className="text-sm text-gray-400">
            No hay admins por habilitar.
          </span>
        )}
      </div>

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, email o usuario…"
        className="mb-6 w-full max-w-md rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
      />

      {loading && <p className="text-gray-500">Cargando…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Traductor
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Artículos asignados
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                  Alta
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Estado
                </th>
                <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((u) => {
                const isAdmin = u.role === "admin";
                const pending = !isAdmin && !u.emailVerified;
                return (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {u.name || "—"}
                      </div>
                      {u.username && (
                        <div className="text-xs text-gray-400">
                          @{u.username}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {u.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-200">
                      {u._count?.translationsAssigned ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("de-DE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isAdmin ? (
                        <span className="inline-block rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">
                          Admin · traduce
                        </span>
                      ) : pending ? (
                        <span className="inline-block rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 text-xs font-medium">
                          Pendiente
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isAdmin ? (
                        <button
                          onClick={() => handleDisableAdmin(u)}
                          disabled={busyId === u.id}
                          className="rounded-md border border-[#BD0E0D] px-3 py-1.5 text-xs font-medium text-[#BD0E0D] hover:bg-[#BD0E0D] hover:text-white transition-colors disabled:opacity-50"
                        >
                          {busyId === u.id ? "…" : "Quitar de traducción"}
                        </button>
                      ) : (
                        <>
                          {pending ? (
                            <button
                              onClick={() => handleResend(u)}
                              disabled={busyId === u.id}
                              className="mr-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                              {busyId === u.id ? "…" : "Reenviar invitación"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendReset(u)}
                              disabled={busyId === u.id}
                              className="mr-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                              {busyId === u.id ? "…" : "Enviar restablecimiento"}
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(u)}
                            disabled={busyId === u.id}
                            className="rounded-md border border-[#BD0E0D] px-3 py-1.5 text-xs font-medium text-[#BD0E0D] hover:bg-[#BD0E0D] hover:text-white transition-colors disabled:opacity-50"
                          >
                            {busyId === u.id ? "…" : "Quitar del equipo"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    No hay traductores que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        tone={confirmState?.tone}
        loading={busyId !== null}
        onConfirm={runConfirm}
        onCancel={() => setConfirmState(null)}
      />

      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg px-4 py-3 text-sm shadow-lg text-white ${
            notice.type === "ok" ? "bg-green-600" : "bg-[#BD0E0D]"
          }`}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}

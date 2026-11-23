"use client";

// Paso 3 — Lista de destinatarios (curada a mano por la AG Web).
// Alta individual, importación con vista previa (pegar o subir CSV), edición
// y borrado. La baja la hace cada persona desde el link del mail: acá no se
// reactiva a nadie.

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FaEdit, FaTrash, FaUpload, FaUserPlus, FaFileImport } from "react-icons/fa";
import { EMAIL_RE, cleanLanguages } from "@/lib/interletterEmail";
import { Modal } from "./ui";
import { LANGS, FLAG, inputCls, labelCls, btnPrimary, btnSecondary } from "./shared";

const emptyForm = { id: null, name: "", email: "", languages: ["de"], consentNote: "" };

// Una línea → { name, email, languages }. Acepta "Name <mail>", "Name; mail; de,es",
// "mail", con ; , o tab. Todo lo anterior al email es el nombre; lo posterior, idiomas.
function parseLine(line) {
  const l = line.trim();
  if (!l) return null;
  const angle = l.match(/^(.*?)<([^>]+)>(.*)$/);
  if (angle) {
    return {
      name: angle[1].replace(/[;,\t"]+/g, " ").trim(),
      email: angle[2].trim(),
      languages: angle[3].replace(/^[\s;,\t]+/, ""),
    };
  }
  const sep = /[;\t]/.test(l) ? /[;\t]/ : /,/;
  const parts = l.split(sep).map((p) => p.replace(/^"|"$/g, "").trim()).filter(Boolean);
  const emailIdx = parts.findIndex((p) => p.includes("@"));
  if (emailIdx < 0) return { name: l, email: "", languages: "", header: /e-?mail/i.test(l) };
  return {
    name: parts.slice(0, emailIdx).join(" "),
    email: parts[emailIdx],
    languages: parts.slice(emailIdx + 1).join(","),
  };
}

export default function RecipientsPanel({ t, onCountChange }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState("");
  const [importing, setImporting] = useState(false);
  const [query, setQuery] = useState("");
  const [showUnsub, setShowUnsub] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/interletter/recipients");
      const d = await r.json();
      setList(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const active = list.filter((r) => !r.unsubscribedAt);
  const unsubscribed = list.length - active.length;
  useEffect(() => {
    if (!loading) onCountChange?.(active.length);
  }, [active.length, loading, onCountChange]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((r) => showUnsub || !r.unsubscribedAt)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.email.includes(q));
  }, [list, query, showUnsub]);

  // Vista previa de la importación (calculada en el navegador).
  const preview = useMemo(() => {
    const existing = new Set(list.map((r) => r.email));
    const seen = new Set();
    return importText
      .split(/\r?\n/)
      .map(parseLine)
      .filter((p) => p && !p.header)
      .map((p) => {
        const email = p.email.trim().toLowerCase();
        let status = "new";
        if (!EMAIL_RE.test(email)) status = "invalid";
        else if (existing.has(email) || seen.has(email)) status = "exists";
        seen.add(email);
        return { ...p, email, languages: cleanLanguages(p.languages), status };
      });
  }, [importText, list]);
  const toImport = preview.filter((p) => p.status === "new");

  async function saveForm(e) {
    e.preventDefault();
    setFormMsg("");
    if (!EMAIL_RE.test(form.email.trim().toLowerCase())) return setFormMsg(t("rcInvalidEmail"));
    if (!form.languages.length) return setFormMsg(t("rcNoLanguage"));
    const payload = {
      name: form.name,
      email: form.email,
      languages: form.languages.join(","),
      consentNote: form.consentNote,
    };
    const res = form.id
      ? await fetch(`/api/admin/interletter/recipients/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/interletter/recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [payload] }),
        });
    const d = await res.json();
    if (!res.ok) return setFormMsg(d.error || t("rcError"));
    if (!form.id && d.created === 0) return setFormMsg(t("rcExists"));
    setForm(emptyForm);
    setFormOpen(false);
    load();
  }

  async function runImport() {
    if (!toImport.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/interletter/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toImport }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || t("rcError"));
      setImportResult(t("rcImportDone", { count: d.created }));
      setImportText("");
      setImportOpen(false);
      load();
    } catch (e) {
      setImportResult(e.message);
    } finally {
      setImporting(false);
    }
  }

  function readFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ""));
    reader.readAsText(f, "utf-8");
    e.target.value = "";
  }

  async function remove(r) {
    if (!confirm(t("rcConfirmDelete", { name: r.name }))) return;
    await fetch(`/api/admin/interletter/recipients/${r.id}`, { method: "DELETE" });
    load();
  }

  function edit(r) {
    setForm({ id: r.id, name: r.name, email: r.email, languages: r.languages.split(","), consentNote: r.consentNote || "" });
    setFormMsg("");
    setFormOpen(true);
  }

  const statusLabel = { new: t("rcPrevNew"), exists: t("rcPrevExists"), invalid: t("rcPrevInvalid") };
  const statusCls = {
    new: "text-green-700 dark:text-green-400",
    exists: "text-gray-400",
    invalid: "text-[#BD0E0D]",
  };

  return (
    <div className="space-y-5 text-sm">
      {/* Resumen + acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {loading ? "…" : active.length}{" "}
            <span className="text-base font-semibold">{t("rcActiveLabel")}</span>
          </p>
          {unsubscribed > 0 && <p className="text-xs text-gray-500">{t("rcUnsubscribedCount", { count: unsubscribed })}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm(emptyForm);
              setFormMsg("");
              setFormOpen(true);
            }}
          >
            <FaUserPlus /> {t("rcAdd")}
          </button>
          <button type="button" className={btnSecondary} onClick={() => setImportOpen(true)}>
            <FaFileImport /> {t("rcImport")}
          </button>
        </div>
      </div>
      {importResult && <p className="text-green-700 dark:text-green-400">{importResult}</p>}

      {/* Lista */}
      {!loading && list.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 space-y-2">
          <p className="font-semibold text-gray-700 dark:text-gray-200">{t("rcEmptyTitle")}</p>
          <p className="text-gray-500">{t("rcEmptyText")}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input className={`${inputCls} max-w-xs`} placeholder={t("rcSearch")} value={query} onChange={(e) => setQuery(e.target.value)} />
            {unsubscribed > 0 && (
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" className="accent-[#BD0E0D]" checked={showUnsub} onChange={(e) => setShowUnsub(e.target.checked)} />
                {t("rcShowUnsub")}
              </label>
            )}
          </div>
          <div className="border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">{t("rcName")}</th>
                  <th className="px-3 py-2">{t("rcEmail")}</th>
                  <th className="px-3 py-2">{t("rcLanguages")}</th>
                  <th className="px-3 py-2 text-center" title={t("rcDeliveries")}>✉</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((r) => (
                  <tr key={r.id} className={r.unsubscribedAt ? "opacity-50" : ""}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{r.name}</div>
                      {r.consentNote && <div className="text-xs text-gray-400 truncate max-w-[220px]">{r.consentNote}</div>}
                      {r.unsubscribedAt && (
                        <span className="text-[11px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700">{t("rcUnsubscribed")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300 break-all">{r.email}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.languages.split(",").map((l) => FLAG[l]).join(" ")}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{r._count?.deliveries || 0}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <button type="button" onClick={() => edit(r)} className="p-1 text-gray-400 hover:text-gray-900" title={t("rcEdit")}>
                        <FaEdit size={13} />
                      </button>
                      <button type="button" onClick={() => remove(r)} className="p-1 text-gray-400 hover:text-[#BD0E0D]" title={t("rcDelete")}>
                        <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                      {t("rcNoMatch")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">{t("rcUnsubExplain")}</p>
        </>
      )}

      {/* Alta / edición */}
      {formOpen && (
        <Modal
          title={form.id ? t("rcEdit") : t("rcAdd")}
          onClose={() => setFormOpen(false)}
          footer={
            <>
              <button type="button" className={btnSecondary} onClick={() => setFormOpen(false)}>
                {t("cancel")}
              </button>
              <button type="submit" form="il-recipient-form" className={btnPrimary}>
                {form.id ? t("save") : t("rcAddBtn")}
              </button>
            </>
          }
        >
          <form id="il-recipient-form" onSubmit={saveForm} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className={labelCls}>{t("rcName")}</label>
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t("rcEmail")}</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <span className={labelCls}>{t("rcLanguages")}</span>
              <p className="text-xs text-gray-500">{t("rcLanguagesHelp")}</p>
              <div className="flex gap-4">
                {LANGS.map((l) => (
                  <label key={l} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-[#BD0E0D]"
                      checked={form.languages.includes(l)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          languages: e.target.checked ? [...form.languages, l] : form.languages.filter((x) => x !== l),
                        })
                      }
                    />
                    {FLAG[l]} {t(`lang_${l}`)}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>{t("rcConsent")}</label>
              <p className="text-xs text-gray-500">{t("rcConsentHelp")}</p>
              <input className={inputCls} value={form.consentNote} placeholder={t("rcConsentPh")} onChange={(e) => setForm({ ...form, consentNote: e.target.value })} />
            </div>
            {formMsg && <p className="text-[#BD0E0D]">{formMsg}</p>}
          </form>
        </Modal>
      )}

      {/* Importación con vista previa */}
      {importOpen && (
        <Modal
          wide
          title={t("rcImport")}
          onClose={() => setImportOpen(false)}
          footer={
            <>
              <button type="button" className={btnSecondary} onClick={() => setImportOpen(false)}>
                {t("cancel")}
              </button>
              <button type="button" className={btnPrimary} onClick={runImport} disabled={!toImport.length || importing}>
                {importing ? "…" : t("rcImportBtn", { count: toImport.length })}
              </button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{t("rcImportHelp")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btnSecondary} onClick={() => fileRef.current?.click()}>
                <FaUpload size={12} /> {t("rcUploadCsv")}
              </button>
              <span className="text-xs text-gray-400">{t("rcOrPaste")}</span>
              <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={readFile} />
            </div>
            <textarea
              rows={6}
              className={`${inputCls} font-mono text-xs`}
              value={importText}
              placeholder={"Maria Pérez <maria@example.org>\nJonas Becker; jonas@example.de; de,es"}
              onChange={(e) => setImportText(e.target.value)}
            />
            {preview.length > 0 && (
              <>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {t("rcPreviewSummary", {
                    nw: toImport.length,
                    exists: preview.filter((p) => p.status === "exists").length,
                    invalid: preview.filter((p) => p.status === "invalid").length,
                  })}
                </p>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {preview.map((p, i) => (
                        <tr key={i}>
                          <td className={`px-2 py-1 font-semibold whitespace-nowrap ${statusCls[p.status]}`}>{statusLabel[p.status]}</td>
                          <td className="px-2 py-1">{p.name || "—"}</td>
                          <td className="px-2 py-1 break-all">{p.email || "—"}</td>
                          <td className="px-2 py-1 whitespace-nowrap">{p.languages.split(",").map((l) => FLAG[l]).join(" ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

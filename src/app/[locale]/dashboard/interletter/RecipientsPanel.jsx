"use client";

// Lista de destinatarios del InterLetter (curada a mano por la AG Web).
// Alta individual, importación pegando una lista, edición y borrado. La baja
// la hace cada persona desde el link del mail: acá no se reactiva a nadie.

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { FaEdit, FaTrash } from "react-icons/fa";
import { EMAIL_RE } from "@/lib/interletterEmail";

const LANGS = ["de", "es", "pt"];
const FLAG = { de: "🇩🇪", es: "🇪🇸", pt: "🇧🇷" };
const emptyForm = { id: null, name: "", email: "", languages: ["de"], consentNote: "" };

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#BD0E0D]";
const labelCls = "block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1";

// Una línea de la importación → { name, email, languages }.
// Acepta: "Name <mail@x.de>", "Name; mail@x.de; de,es", "mail@x.de", también con tab o coma.
function parseLine(line) {
  const l = line.trim();
  if (!l) return null;
  const angle = l.match(/^(.*?)<([^>]+)>(.*)$/);
  if (angle) {
    return {
      name: angle[1].replace(/[;,\t"]+$/g, "").replace(/"/g, "").trim(),
      email: angle[2].trim(),
      languages: angle[3].replace(/^[\s;,\t]+/, ""),
    };
  }
  // Separador: ; o tab; si no hay ninguno, coma ("Name, mail, de,es" también sirve:
  // todo lo que va antes del email es el nombre y todo lo de después, idiomas).
  const sep = /[;\t]/.test(l) ? /[;\t]/ : /,/;
  const parts = l.split(sep).map((p) => p.trim()).filter(Boolean);
  const emailIdx = parts.findIndex((p) => p.includes("@"));
  if (emailIdx < 0) return { name: l, email: "", languages: "" };
  return {
    name: parts.slice(0, emailIdx).join(" "),
    email: parts[emailIdx],
    languages: parts.slice(emailIdx + 1).join(","),
  };
}

export default function RecipientsPanel() {
  const t = useTranslations("interletter");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [formMsg, setFormMsg] = useState("");
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [query, setQuery] = useState("");

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

  const active = list.filter((r) => !r.unsubscribedAt).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => r.name.toLowerCase().includes(q) || r.email.includes(q));
  }, [list, query]);

  async function saveForm(e) {
    e.preventDefault();
    setFormMsg("");
    if (!EMAIL_RE.test(form.email.trim())) {
      setFormMsg(t("rcInvalidEmail"));
      return;
    }
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
    if (!res.ok) {
      setFormMsg(d.error || t("rcError"));
      return;
    }
    if (!form.id && d.created === 0) {
      setFormMsg(t("rcExists"));
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function runImport() {
    setImportMsg("");
    const items = importText.split(/\r?\n/).map(parseLine).filter(Boolean);
    if (!items.length) return;
    const res = await fetch("/api/admin/interletter/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const d = await res.json();
    if (!res.ok) {
      setImportMsg(d.error || t("rcError"));
      return;
    }
    let msg = t("rcImportResult", {
      created: d.created,
      skipped: d.skipped.length,
      invalid: d.invalid.length,
    });
    if (d.invalid.length) msg += ` — ${t("rcInvalidList")}: ${d.invalid.join(", ")}`;
    setImportMsg(msg);
    if (!d.invalid.length) setImportText("");
    load();
  }

  async function remove(r) {
    if (!confirm(t("rcConfirmDelete", { name: r.name }))) return;
    await fetch(`/api/admin/interletter/recipients/${r.id}`, { method: "DELETE" });
    load();
  }

  function edit(r) {
    setForm({
      id: r.id,
      name: r.name,
      email: r.email,
      languages: r.languages.split(","),
      consentNote: r.consentNote || "",
    });
    setFormMsg("");
  }

  return (
    <div className="space-y-6 text-sm">
      {/* Alta / edición */}
      <form onSubmit={saveForm} className="p-4 border border-gray-200 dark:border-gray-700 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{form.id ? t("rcEdit") : t("rcAdd")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>{t("rcName")}</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className={labelCls}>{t("rcEmail")}</label>
            <input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={labelCls + " mb-0"}>{t("rcLanguages")}:</span>
          {LANGS.map((l) => (
            <label key={l} className="flex items-center gap-1 cursor-pointer">
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
              {FLAG[l]} {l.toUpperCase()}
            </label>
          ))}
        </div>
        <div>
          <label className={labelCls}>{t("rcConsent")}</label>
          <input
            className={inputCls}
            value={form.consentNote}
            placeholder={t("rcConsentPh")}
            onChange={(e) => setForm({ ...form, consentNote: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="px-4 py-2 font-semibold rounded-md bg-[#BD0E0D] hover:bg-[#a50c0b] text-white">
            {form.id ? t("rcUpdate") : t("rcSave")}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600"
            >
              {t("rcCancel")}
            </button>
          )}
          {formMsg && <span className="text-red-600">{formMsg}</span>}
        </div>
      </form>

      {/* Importación */}
      <details className="p-4 border border-gray-200 dark:border-gray-700">
        <summary className="font-bold cursor-pointer text-gray-900 dark:text-gray-100">{t("rcImport")}</summary>
        <p className="text-[11px] text-gray-500 my-2 whitespace-pre-line">{t("rcImportHint")}</p>
        <textarea
          rows={6}
          className={inputCls + " font-mono text-xs"}
          value={importText}
          placeholder={"Maria Pérez <maria@example.org>\nJonas Becker; jonas@example.de; de,es"}
          onChange={(e) => setImportText(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runImport}
            disabled={!importText.trim()}
            className="px-4 py-2 font-semibold rounded-md bg-[#BD0E0D] hover:bg-[#a50c0b] text-white disabled:opacity-50"
          >
            {t("rcImportBtn")}
          </button>
          {importMsg && <span className="text-gray-700 dark:text-gray-300">{importMsg}</span>}
        </div>
      </details>

      {/* Lista */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {t("rcActive", { count: active })}
            {list.length > active && (
              <span className="font-normal text-gray-500"> · {t("rcUnsubscribedCount", { count: list.length - active })}</span>
            )}
          </span>
          <input
            className={inputCls + " max-w-[220px]"}
            placeholder={t("rcSearch")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {loading ? (
          <p className="text-gray-400">…</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">{t("rcEmpty")}</p>
        ) : (
          <ul className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map((r) => (
              <li key={r.id} className={`flex items-start gap-3 px-3 py-2 ${r.unsubscribedAt ? "opacity-50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {r.name}{" "}
                    <span className="font-normal text-xs">{r.languages.split(",").map((l) => FLAG[l]).join(" ")}</span>
                    {r.unsubscribedAt && (
                      <span className="ml-2 text-[11px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        {t("rcUnsubscribed")}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{r.email}</div>
                  {r.consentNote && <div className="text-[11px] text-gray-400 truncate">{r.consentNote}</div>}
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap mt-1" title={t("rcDeliveries")}>
                  ✉ {r._count?.deliveries || 0}
                </span>
                <button type="button" onClick={() => edit(r)} className="p-1 text-gray-500 hover:text-gray-900" title={t("rcEdit")}>
                  <FaEdit size={13} />
                </button>
                <button type="button" onClick={() => remove(r)} className="p-1 text-gray-500 hover:text-red-600" title={t("rcDelete")}>
                  <FaTrash size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

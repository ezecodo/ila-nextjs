"use client";

// Pantalla inicial del módulo: borradores en curso (compartidos por toda la
// AG Web) + archivo de enviados. Desde acá se crea uno nuevo.

import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaEdit, FaTrash, FaEye, FaCopy, FaEnvelopeOpenText, FaFileAlt, FaMagic, FaRedo } from "react-icons/fa";
import { renderInterletterEmail } from "@/lib/interletterEmail";
import { HelpBox, Modal } from "./ui";
import InterletterFaq from "./InterletterFaq";
import { sampleDraft } from "./interletterSample";
import { defaultDraft, nextFromPrevious, formatDateTime, btnPrimary, btnSecondary } from "./shared";

// Borrador del primer prototipo (vivía en localStorage, antes de la BD).
const LEGACY_KEY = "ila-interletter-draft-v2";

export default function InterletterList({ t, onOpen, flash }) {
  const [items, setItems] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [legacy, setLegacy] = useState(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/interletter");
    const d = await r.json();
    setItems(Array.isArray(d) ? d : []);
  }, []);

  useEffect(() => {
    load();
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw) setLegacy(JSON.parse(raw));
    } catch {
      /* ignorar */
    }
  }, [load]);

  const drafts = (items || []).filter((i) => i.status === "draft");
  const sent = (items || []).filter((i) => i.status === "sent");
  const lastSent = sent[0];

  async function create(content) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/interletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      onOpen(d.id);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function createFromLast() {
    const r = await fetch(`/api/admin/interletter/${lastSent.id}`);
    const d = await r.json();
    await create(nextFromPrevious(d.content));
  }

  async function importLegacy() {
    await create({ ...defaultDraft(), ...legacy });
    localStorage.removeItem(LEGACY_KEY);
  }

  async function removeDraft(it) {
    if (!confirm(t("confirmDeleteDraft"))) return;
    await fetch(`/api/admin/interletter/${it.id}`, { method: "DELETE" });
    load();
  }

  async function showPreview(it) {
    const r = await fetch(`/api/admin/interletter/${it.id}`);
    setPreview(await r.json());
  }

  async function reuse(it) {
    const r = await fetch(`/api/admin/interletter/${it.id}`);
    const d = await r.json();
    await create(nextFromPrevious(d.content));
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FaEnvelopeOpenText className="text-[#BD0E0D]" /> InterLetter
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{t("intro")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InterletterFaq />
          <button type="button" className={btnPrimary} onClick={() => setNewOpen(true)} disabled={busy}>
            <FaPlus /> {t("newInterletter")}
          </button>
        </div>
      </div>

      {flash && <div className="p-3 border border-green-300 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm">{flash}</div>}

      <HelpBox id="overview" title={t("howTitle")} closeLabel={t("close")}>
        <ol className="list-decimal pl-5 space-y-0.5">
          <li>{t("how1")}</li>
          <li>{t("how2")}</li>
          <li>{t("how3")}</li>
          <li>{t("how4")}</li>
        </ol>
        <p className="pt-1">{t("howShared")}</p>
      </HelpBox>

      {legacy && (
        <div className="p-3 border border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-sm flex flex-wrap items-center gap-3">
          <span className="flex-1 text-amber-900 dark:text-amber-100">{t("legacyFound")}</span>
          <button type="button" className={btnSecondary} onClick={importLegacy}>
            {t("legacyImport")}
          </button>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => {
              localStorage.removeItem(LEGACY_KEY);
              setLegacy(null);
            }}
          >
            {t("legacyDiscard")}
          </button>
        </div>
      )}

      {/* Borradores */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t("draftsTitle")}</h2>
        <p className="text-xs text-gray-500 mb-3">{t("draftsHelp")}</p>
        {items === null ? (
          <p className="text-gray-400">…</p>
        ) : drafts.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500">
            {t("noDrafts")}
          </div>
        ) : (
          <ul className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {drafts.map((it) => (
              <li key={it.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <FaFileAlt className="text-gray-400 shrink-0" />
                <button type="button" onClick={() => onOpen(it.id)} className="flex-1 min-w-0 text-left">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100 truncate">{it.subject}</span>
                  <span className="block text-xs text-gray-500">
                    {t("lastEdited", { when: formatDateTime(it.updatedAt), who: it.updatedByEmail || "?" })}
                  </span>
                </button>
                <button type="button" onClick={() => onOpen(it.id)} className={btnSecondary}>
                  <FaEdit size={12} /> {t("continueEditing")}
                </button>
                <button type="button" onClick={() => removeDraft(it)} className="p-2 text-gray-400 hover:text-[#BD0E0D]" title={t("deleteDraft")}>
                  <FaTrash size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Enviados */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{t("sentTitle")}</h2>
        <p className="text-xs text-gray-500 mb-3">{t("sentHelp")}</p>
        {items !== null && sent.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noSent")}</p>
        ) : (
          <ul className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {sent.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100 truncate">{it.subject}</span>
                  <span className="block text-xs text-gray-500">
                    {t("sentInfo", { when: formatDateTime(it.sentAt), count: it.recipientCount, who: it.sentByEmail || "?" })}
                    {it.failedCount > 0 && <span className="text-[#BD0E0D]"> · {t("sentFailed", { count: it.failedCount })}</span>}
                  </span>
                </div>
                <button type="button" onClick={() => showPreview(it)} className={btnSecondary}>
                  <FaEye size={12} /> {t("view")}
                </button>
                <button type="button" onClick={() => reuse(it)} className={btnSecondary} title={t("reuseHelp")}>
                  <FaCopy size={12} /> {t("reuse")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Nuevo */}
      {newOpen && (
        <Modal title={t("newInterletter")} onClose={() => setNewOpen(false)}>
          <div className="space-y-2">
            {lastSent && (
              <NewOption icon={<FaRedo />} title={t("newFromLast")} text={t("newFromLastHelp")} onClick={createFromLast} disabled={busy} />
            )}
            <NewOption icon={<FaFileAlt />} title={t("newEmpty")} text={t("newEmptyHelp")} onClick={() => create(defaultDraft())} disabled={busy} />
            <NewOption icon={<FaMagic />} title={t("newSample")} text={t("newSampleHelp")} onClick={() => create(sampleDraft())} disabled={busy} />
          </div>
        </Modal>
      )}

      {preview && (
        <Modal wide title={preview.subject} onClose={() => setPreview(null)}>
          <iframe
            title={preview.subject}
            sandbox=""
            className="w-full h-[70vh] border-0 bg-[#f2f2ef]"
            srcDoc={renderInterletterEmail(preview.content, { assetBase: window.location.origin })}
          />
        </Modal>
      )}
    </div>
  );
}

function NewOption({ icon, title, text, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-start gap-3 p-4 text-left border border-gray-200 dark:border-gray-700 hover:border-[#BD0E0D] hover:bg-red-50/40 dark:hover:bg-red-900/10 disabled:opacity-50"
    >
      <span className="mt-0.5 text-[#BD0E0D]">{icon}</span>
      <span>
        <span className="block font-semibold text-gray-900 dark:text-gray-100">{title}</span>
        <span className="block text-sm text-gray-500">{text}</span>
      </span>
    </button>
  );
}

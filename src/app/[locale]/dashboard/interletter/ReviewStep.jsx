"use client";

// Paso 4 — Revisar y enviar: checklist (cada punto lleva al paso donde se
// arregla), Testmail y ventana de envío con confirmación explícita.

import { useState } from "react";
import { FaPaperPlane, FaEnvelope, FaArrowRight } from "react-icons/fa";
import { interletterSubject } from "@/lib/interletterEmail";
import { StatusIcon, Modal } from "./ui";
import { activeLangList, FLAG, btnPrimary, btnSecondary } from "./shared";

// Límite diario del plan gratuito de Resend (incluye los mails transaccionales).
const DAILY_LIMIT = 100;

export default function ReviewStep({ t, draft, issues, activeCount, testState, onSendTest, onSend, goStep, sessionEmail }) {
  const [dialog, setDialog] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warn");
  const langs = activeLangList(draft);
  const topicsWithTitle = (draft.topics || []).filter((tp) => tp.title?.de?.trim());
  const testOk = testState.status === "ok" && !testState.stale;

  async function doSend() {
    setSending(true);
    setError("");
    try {
      await onSend();
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  }

  const Check = ({ state, children, step }) => (
    <li className="flex items-start gap-3 py-2">
      <span className="mt-0.5">
        <StatusIcon state={state} />
      </span>
      <span className="flex-1 text-gray-800 dark:text-gray-200">{children}</span>
      {step && state !== "ok" && (
        <button type="button" onClick={() => goStep(step)} className="text-xs text-[#BD0E0D] hover:underline whitespace-nowrap">
          {t("fixIt")} <FaArrowRight className="inline" size={9} />
        </button>
      )}
    </li>
  );

  return (
    <div className="space-y-6 text-sm">
      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">{t("sumRecipients")}</p>
          <p className="text-xl font-bold">{activeCount ?? "…"}</p>
        </div>
        <div className="p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">{t("sumTopics")}</p>
          <p className="text-xl font-bold">{topicsWithTitle.length}</p>
        </div>
        <div className="p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500">{t("sumLanguages")}</p>
          <p className="text-xl font-bold">{langs.map((l) => FLAG[l]).join(" ")}</p>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{t("checklistTitle")}</h3>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800 border-y border-gray-100 dark:border-gray-800">
          {errors.map((i, n) => (
            <Check key={`e${n}`} state="error" step={i.step}>
              {t(i.key, i.params)}
            </Check>
          ))}
          {warnings.map((i, n) => (
            <Check key={`w${n}`} state="warn" step={i.step}>
              {t(i.key, i.params)}
            </Check>
          ))}
          {errors.length === 0 && warnings.length === 0 && <Check state="ok">{t("checkAllGood")}</Check>}
          <Check state={testOk ? "ok" : "warn"}>
            {testOk ? t("checkTestDone", { email: testState.to }) : testState.stale ? t("checkTestStale") : t("checkTestMissing")}
          </Check>
        </ul>
        {warnings.length > 0 && errors.length === 0 && <p className="text-xs text-gray-500 mt-2">{t("warningsOk")}</p>}
      </div>

      {/* Testmail */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 space-y-2">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{t("testTitle")}</h3>
        <p className="text-gray-600 dark:text-gray-300">{t("testText", { email: sessionEmail || "" })}</p>
        <button type="button" onClick={onSendTest} disabled={testState.status === "sending"} className={btnSecondary}>
          <FaEnvelope /> {testState.status === "sending" ? t("sending") : t("sendTest")}
        </button>
        {testState.status === "error" && <p className="text-[#BD0E0D]">{testState.msg}</p>}
        {testState.status === "ok" && !testState.stale && (
          <p className="text-green-700 dark:text-green-400">{t("testSent", { email: testState.to })}</p>
        )}
      </div>

      {/* Envío */}
      <div className="p-4 border-2 border-[#BD0E0D]/30 space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{t("sendTitle")}</h3>
        <p className="text-gray-600 dark:text-gray-300">{t("sendText")}</p>
        {activeCount > DAILY_LIMIT && <p className="text-[#BD0E0D] text-xs">{t("sendLimit", { limit: DAILY_LIMIT })}</p>}
        <button
          type="button"
          className={btnPrimary}
          disabled={errors.length > 0 || !activeCount}
          onClick={() => {
            setConfirmed(false);
            setError("");
            setDialog(true);
          }}
        >
          <FaPaperPlane /> {t("sendButton", { count: activeCount ?? 0 })}
        </button>
        {errors.length > 0 && <p className="text-xs text-[#BD0E0D]">{t("sendBlocked")}</p>}
      </div>

      {dialog && (
        <Modal
          title={t("dialogTitle")}
          onClose={sending ? undefined : () => setDialog(false)}
          footer={
            <>
              <button type="button" className={btnSecondary} disabled={sending} onClick={() => setDialog(false)}>
                {t("cancel")}
              </button>
              <button type="button" className={btnPrimary} disabled={!confirmed || sending} onClick={doSend}>
                <FaPaperPlane /> {sending ? t("sendingNow") : t("sendNow", { count: activeCount })}
              </button>
            </>
          }
        >
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-xs text-gray-500">{t("dlSubject")}</dt>
              <dd className="font-semibold">{interletterSubject(draft)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{t("dlTo")}</dt>
              <dd>{t("dlToValue", { count: activeCount })}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{t("dlFrom")}</dt>
              <dd className="font-mono text-xs">ila InterLetter &lt;interletter@ila-web.de&gt;</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500">{t("dlReplies")}</dt>
              <dd className="font-mono text-xs">ila-bonn@t-online.de</dd>
            </div>
          </dl>
          {!testOk && <p className="mt-4 text-xs text-amber-600">{t("dialogNoTest")}</p>}
          <label className="mt-4 flex items-start gap-2 cursor-pointer text-sm">
            <input type="checkbox" className="mt-1 accent-[#BD0E0D]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>{t("dialogConfirm")}</span>
          </label>
          {error && <p className="mt-3 text-[#BD0E0D]">{error}</p>}
        </Modal>
      )}
    </div>
  );
}

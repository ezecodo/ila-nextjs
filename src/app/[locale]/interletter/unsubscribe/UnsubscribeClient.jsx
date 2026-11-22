"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

// Pide confirmar con un botón: un GET nunca da de baja (los escáneres de
// correo abren los links del mail solos).
export default function UnsubscribeClient() {
  const t = useTranslations("interletterUnsubscribe");
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState("loading"); // loading | ready | done | already | notfound | error
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setState("notfound");
      return;
    }
    fetch(`/api/interletter/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.found) return setState("notfound");
        setEmail(d.email);
        setState(d.unsubscribed ? "already" : "ready");
      })
      .catch(() => setState("error"));
  }, [token]);

  async function confirm() {
    setState("loading");
    try {
      const r = await fetch(`/api/interletter/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const d = await r.json();
      setState(d.success ? "done" : "notfound");
    } catch {
      setState("error");
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-16 font-geist">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t("title")}</h1>
      {state === "loading" && <p className="text-gray-500">…</p>}
      {state === "ready" && (
        <>
          <p className="mb-6 text-gray-700 dark:text-gray-300">{t("question", { email })}</p>
          <button
            type="button"
            onClick={confirm}
            className="px-6 py-3 rounded-none bg-[#BD0E0D] hover:bg-[#a50c0b] text-white font-semibold"
          >
            {t("confirm")}
          </button>
        </>
      )}
      {state === "done" && <p className="text-gray-700 dark:text-gray-300">{t("done")}</p>}
      {state === "already" && <p className="text-gray-700 dark:text-gray-300">{t("already", { email })}</p>}
      {state === "notfound" && <p className="text-gray-700 dark:text-gray-300">{t("notFound")}</p>}
      {state === "error" && <p className="text-red-600">{t("error")}</p>}
    </main>
  );
}

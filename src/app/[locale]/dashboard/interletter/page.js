"use client";

// InterLetter — mailing a autor*innen, Illustrator*innen y Fotograf*innen
// (≈10/año): tema actual + los dos siguientes. Diseño del mail según el
// borrador de la redacción (ver src/lib/interletterEmail.js).
//
// Pantallas:
// - InterletterList: borradores (en la BD, compartidos por toda la AG Web) +
//   archivo de enviados; crear nuevo (vacío / desde el último / ejemplo).
// - InterletterEditor: asistente de 4 pasos con guardado automático.

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import InterletterList from "./InterletterList";
import InterletterEditor from "./InterletterEditor";

// Recuerda el borrador abierto si se recarga la página (solo esta pestaña).
const OPEN_KEY = "ila-interletter-open";

export default function InterletterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("interletter");
  const [openId, setOpenId] = useState(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const saved = Number(sessionStorage.getItem(OPEN_KEY));
    if (saved) setOpenId(saved);
    setReady(true);
  }, []);

  function open(id) {
    setFlash("");
    sessionStorage.setItem(OPEN_KEY, String(id));
    setOpenId(id);
    window.scrollTo(0, 0);
  }

  function back() {
    sessionStorage.removeItem(OPEN_KEY);
    setOpenId(null);
    window.scrollTo(0, 0);
  }

  if (!ready) return null;

  if (openId) {
    return (
      <InterletterEditor
        key={openId}
        id={openId}
        t={t}
        sessionEmail={session?.user?.email}
        onBack={back}
        onSent={({ sent, failed }) => {
          back();
          setFlash(t("flashSent", { sent }) + (failed ? ` ${t("flashFailed", { failed })}` : ""));
        }}
      />
    );
  }
  return <InterletterList t={t} onOpen={open} flash={flash} />;
}

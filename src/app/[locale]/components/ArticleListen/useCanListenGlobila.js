"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const SUPER_ADMIN_EMAIL = "e.zeangeloni@gmail.com";

// Elegibilidad para escuchar artículos dentro de GLOBila / Expediciones.
// El super-admin siempre; el resto según el flag `globila` + su audiencia.
export function useCanListenGlobila() {
  const { data: session } = useSession();
  const [flags, setFlags] = useState(null);
  const [hasPdfAbo, setHasPdfAbo] = useState(false);

  useEffect(() => {
    fetch("/api/feature-flags")
      .then((r) => r.json())
      .then(setFlags)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/user/pdf-abo")
      .then((r) => r.json())
      .then((d) => setHasPdfAbo(!!d?.hasPdfAbo))
      .catch(() => {});
  }, []);

  const email = session?.user?.email || null;
  const role = session?.user?.role || null;

  if (email === SUPER_ADMIN_EMAIL) return true;
  const g = flags?.globila;
  if (!g) return false;
  return (
    (role === "admin" && g.admin) ||
    (hasPdfAbo && g.digitalabo) ||
    (role === "translator" && g.translator) ||
    !!g.user
  );
}

"use client";

import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState("Verificando...");

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setStatus("❌ Token inválido o faltante.");
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus(
            "✅ Correo verificado exitosamente. Ahora puedes iniciar sesión."
          );
        } else {
          setStatus(
            `❌ Error: ${data.error || "No se pudo verificar el correo."}`
          );
        }
      } catch {
        setStatus("❌ Error al verificar el correo.");
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Verificación de correo</h2>
      <p>{status}</p>
    </div>
  );
}

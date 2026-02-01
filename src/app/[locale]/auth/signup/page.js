"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignUpForm() {
  const searchParams = useSearchParams();
  const isPdfAbo = searchParams.get("pdfAbo") === "true";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // "error" | "success"
  const [language, setLanguage] = useState("de");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        password,
        confirmPassword,
        language,
        pdfAbo: isPdfAbo,
      }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (res.ok) {
      setMessageType("success");
      if (data.pdfAboActivated) {
        setMessage(
          "¡Registro exitoso! Tu PDF ABO ha sido activado. Verifica tu correo para completar el registro.",
        );
      } else {
        setMessage("Registro exitoso. Verifica tu correo.");
      }
    } else {
      setMessageType("error");
      setMessage(data.error || "Error en el registro.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Registro</h2>

      {isPdfAbo && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
          📰 Estás registrándote para activar tu <strong>PDF ABO</strong>. Usa
          el mismo email donde recibiste la invitación.
        </div>
      )}

      {message && (
        <p
          className={`mb-4 ${messageType === "error" ? "text-red-600" : "text-green-600"}`}
        >
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="password"
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {isLoading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <SignUpForm />
    </Suspense>
  );
}

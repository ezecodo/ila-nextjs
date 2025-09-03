"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const t = useTranslations("auth");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Resetear el error

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Credenciales incorrectas. Inténtalo de nuevo.");
    } else {
      // 🚀 Hacer fetch a la sesión para obtener el rol del usuario
      const res = await fetch("/api/auth/session");
      const session = await res.json();

      if (session?.user?.role === "admin") {
        router.push("/dashboard");
      } else if (session?.user?.role === "translator") {
        router.push("/dashboard/translators"); // 🔥 ruta nueva
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="mb-4">
          <label className="block text-gray-700">{t("email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mt-1"
            required
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {t("button")}
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link
          href="/auth/forgot-password"
          className="text-blue-500 hover:underline"
        >
          {t("forgot")}
        </Link>
      </p>

      <div className="mt-2 text-center text-sm text-gray-700">
        {t("noAccount")}{" "}
        <Link href="/auth/signup" className="text-blue-500 hover:underline">
          {t("signupLink")}
        </Link>
      </div>
    </div>
  );
}

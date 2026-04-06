"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

function SignUpForm() {
  const searchParams = useSearchParams();
  const isPdfAbo = searchParams.get("pdfAbo") === "true";
  const t = useTranslations("auth");

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [language, setLanguage] = useState("de");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    if (password !== confirmPassword) {
      setMessage(t("signup.errorPasswordMismatch"));
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
      setMessage(data.pdfAboActivated ? t("signup.successPdfAbo") : t("signup.successDefault"));
    } else {
      setMessageType("error");
      setMessage(data.error || t("signup.errorDefault"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image
              src="/ila-logo.png"
              alt="ILA"
              width={72}
              height={72}
              className=""
            />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-8">
          <h1 className="futura text-2xl font-bold text-[var(--foreground)] mb-6 tracking-wide uppercase">
            {t("signup.title")}
          </h1>

          {isPdfAbo && (
            <div className="mb-5 border-l-4 border-[#d13120] bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
              📰 {t("signup.pdfAboNotice")}
            </div>
          )}

          {message && (
            <div
              className={`mb-5 border-l-4 px-4 py-3 text-sm ${
                messageType === "error"
                  ? "border-[#d13120] bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {t("signup.namePlaceholder")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)] text-sm focus:outline-none focus:border-[#d13120] transition-colors"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {t("signup.emailPlaceholder")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)] text-sm focus:outline-none focus:border-[#d13120] transition-colors"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {t("signup.passwordPlaceholder")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)] text-sm focus:outline-none focus:border-[#d13120] transition-colors"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {t("signup.confirmPasswordPlaceholder")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)] text-sm focus:outline-none focus:border-[#d13120] transition-colors"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Sprache / Idioma
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)] text-sm focus:outline-none focus:border-[#d13120] transition-colors appearance-none cursor-pointer"
              >
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#d13120] hover:bg-[#b82a1b] disabled:opacity-60 text-white py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {isLoading ? t("signup.loadingButton") : t("signup.submitButton")}
            </button>
          </form>

          <div className="mt-5 text-sm text-center text-gray-400 dark:text-gray-500">
            <Link href="/auth/signin" className="text-[#d13120] hover:underline font-medium">
              {t("title")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const t = useTranslations("auth");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <p className="text-gray-400 text-sm">{t("loading")}</p>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}

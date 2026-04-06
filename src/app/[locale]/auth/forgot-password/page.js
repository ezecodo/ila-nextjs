"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (res.ok) {
      setIsSuccess(true);
      setMessage(t("forgotPassword.success"));
    } else {
      setIsSuccess(false);
      setMessage(data.error || t("forgotPassword.error"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
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
          <h1 className="futura text-2xl font-bold text-[var(--foreground)] mb-2 tracking-wide uppercase">
            {t("forgotPassword.title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {t("email")}
          </p>

          {message && (
            <div
              className={`mb-5 border-l-4 px-4 py-3 text-sm ${
                isSuccess
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "border-[#d13120] bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {t("email")}
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

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full bg-[#d13120] hover:bg-[#b82a1b] disabled:opacity-60 text-white py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {isLoading ? "..." : t("forgotPassword.submitButton")}
            </button>
          </form>

          <div className="mt-5 text-sm text-center">
            <Link
              href="/auth/signin"
              className="text-gray-500 dark:text-gray-400 hover:text-[#d13120] transition-colors"
            >
              ← {t("button")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

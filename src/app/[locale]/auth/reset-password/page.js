"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("auth");

  useEffect(() => {
    setToken(searchParams.get("token"));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    if (!token) {
      setIsSuccess(false);
      setMessage(t("resetPassword.errorToken"));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setIsSuccess(false);
      setMessage(t("resetPassword.errorPasswordMismatch"));
      setIsLoading(false);
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (res.ok) {
      setIsSuccess(true);
      setMessage(t("resetPassword.success"));
      setTimeout(() => router.push("/auth/signin"), 2000);
    } else {
      setIsSuccess(false);
      setMessage(data.error || t("resetPassword.errorDefault"));
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
          <h1 className="futura text-2xl font-bold text-[var(--foreground)] mb-6 tracking-wide uppercase">
            {t("resetPassword.title")}
          </h1>

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
                {t("resetPassword.newPasswordPlaceholder")}
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
                {t("resetPassword.confirmPasswordPlaceholder")}
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

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full bg-[#d13120] hover:bg-[#b82a1b] disabled:opacity-60 text-white py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {isLoading ? "..." : t("resetPassword.submitButton")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <p className="text-gray-400 text-sm">{t("loading")}</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

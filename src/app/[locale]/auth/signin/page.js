"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(t("error"));
      setIsLoading(false);
    } else {
      const res = await fetch("/api/auth/session");
      const session = await res.json();

      if (session?.user?.role === "admin") {
        router.push("/dashboard");
      } else if (session?.user?.role === "translator") {
        router.push("/dashboard/translators");
      } else {
        router.push("/");
      }
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
            {t("title")}
          </h1>

          {error && (
            <div className="mb-5 border-l-4 border-[#d13120] bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-[var(--foreground)] text-sm focus:outline-none focus:border-[#d13120] transition-colors"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#d13120] hover:bg-[#b82a1b] disabled:opacity-60 text-white py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors"
            >
              {isLoading ? "..." : t("button")}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-sm text-center">
            <Link
              href="/auth/forgot-password"
              className="text-gray-500 dark:text-gray-400 hover:text-[#d13120] transition-colors"
            >
              {t("forgot")}
            </Link>
            <span className="text-gray-400 dark:text-gray-500">
              {t("noAccount")}{" "}
              <Link
                href="/auth/signup"
                className="text-[#d13120] hover:underline font-medium"
              >
                {t("signupLink")}
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

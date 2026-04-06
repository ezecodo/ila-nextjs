"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage(t("verify.errorToken"));
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(t("verify.success"));
        } else {
          setStatus("error");
          setMessage(data.error || t("verify.errorDefault"));
        }
      } catch {
        setStatus("error");
        setMessage(t("verify.errorDefault"));
      }
    };

    verifyEmail();
  }, []);

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
            {t("verify.title")}
          </h1>

          {status === "loading" && (
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <svg
                className="animate-spin h-4 w-4 text-[#d13120]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {t("verify.verifying")}
            </div>
          )}

          {status !== "loading" && (
            <div
              className={`border-l-4 px-4 py-3 text-sm ${
                status === "success"
                  ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                  : "border-[#d13120] bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
              }`}
            >
              {message}
            </div>
          )}

          {status === "success" && (
            <div className="mt-5 text-center">
              <Link
                href="/auth/signin"
                className="inline-block bg-[#d13120] hover:bg-[#b82a1b] text-white px-6 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                {t("button")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

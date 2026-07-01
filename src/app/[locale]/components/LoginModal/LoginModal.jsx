"use client";

import { Dialog } from "@headlessui/react";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function LoginModal({ open, onClose }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");

  // Resetea el formulario cada vez que se abre el modal (evita que isLoading,
  // error o credenciales viejas queden colgados tras un login/logout previo).
  useEffect(() => {
    if (open) {
      setEmail("");
      setPassword("");
      setError("");
      setIsLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(t("error"));
        return;
      }

      // Cerramos el modal apenas el login es válido. La navegación por rol
      // va después: si algo falla al resolver la sesión, igual quedó cerrado.
      onClose();

      let role;
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        role = session?.user?.role;
      } catch {
        role = undefined;
      }

      if (role === "admin") {
        router.push("/dashboard");
      } else if (role === "translator") {
        router.push("/dashboard/translators");
      } else {
        // Lector normal: se queda donde estaba, solo refrescamos la sesión
        router.refresh();
      }
    } catch {
      setError(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 px-4"
    >
      <Dialog.Panel className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-150">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/ila-logo.png" alt="ILA" width={64} height={64} />
        </div>

        {/* Card */}
        <div className="relative bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 text-gray-400 hover:text-[#BD0E0D] transition-colors text-lg leading-none"
          >
            ✕
          </button>

          <Dialog.Title className="futura text-2xl font-bold text-[var(--foreground)] mb-6 tracking-wide uppercase">
            {t("title")}
          </Dialog.Title>

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
              onClick={onClose}
              className="text-gray-500 dark:text-gray-400 hover:text-[#d13120] transition-colors"
            >
              {t("forgot")}
            </Link>
            <span className="text-gray-400 dark:text-gray-500">
              {t("noAccount")}{" "}
              <Link
                href="/auth/signup"
                onClick={onClose}
                className="text-[#d13120] hover:underline font-medium"
              >
                {t("signupLink")}
              </Link>
            </span>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

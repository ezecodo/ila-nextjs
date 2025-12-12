"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

export default function DonationBanner({
  hideForRoles = ["admin", "editor", "reviewer", "translator"],
}) {
  const t = useTranslations("donation");
  const { data: session, status } = useSession();

  // ⏳ Evitar parpadeo mientras se resuelve la sesión
  if (status === "loading") return null;

  // 🔒 Ocultar a roles internos (por defecto: admin, editor, reviewer, translator)
  const role = session?.user?.role;
  if (role && hideForRoles.includes(role)) return null;

  const donateHref = "/donar";

  return (
    <div className="bg-red-600 text-white p-6 shadow-lg flex flex-col items-center text-center gap-4">
      <div>
        <h3 className="text-xl font-bold mb-2">{t("title")}</h3>
        <p className="text-sm leading-snug">{t("body")}</p>
      </div>
      <Link
        href={donateHref}
        className="bg-white text-red-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition"
        aria-label={t("cta")}
      >
        {t("cta")}
      </Link>
    </div>
  );
}

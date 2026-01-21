"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import IlaLogo from "../IlaLogo/IlaLogo";

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
    <div className="bg-[#e60000] text-white p-5 shadow-xl flex flex-col items-center text-center gap-1 border-t-4 border-red-800">
      <div className="mb-0">
        <IlaLogo size="default" variant="white-solid" isLink={false} />
      </div>
      <div>
        <h3 className="text-2xl font-black mb-3 tracking-tight">
          {t("title")}
        </h3>
        <p className="text-base leading-relaxed max-w-md">{t("body")}</p>
      </div>
      <Link
        href={donateHref}
        className="bg-white text-red-600 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 hover:shadow-lg transition-all transform hover:scale-105"
        aria-label={t("cta")}
      >
        {t("cta")}
      </Link>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function DonationBanner() {
  const t = useTranslations("donation");
  const locale = useLocale();

  // Ruta del botón según idioma (ajústala si tus rutas son otras)
  const donateHref = locale === "de" ? "/spenden" : "/donar";

  return (
    <div className="bg-red-600 text-white p-6 shadow-lg flex flex-col items-center text-center gap-4">
      {/* Logo */}
      <div className="w-20 h-20 relative">
        <Image
          src="/ila-logo.png"
          alt="ila Logo"
          fill
          className="object-contain"
          sizes="80px"
        />
      </div>

      {/* Texto */}
      <div>
        <h3 className="text-xl font-bold mb-2">{t("title")}</h3>
        <p className="text-sm leading-snug">{t("body")}</p>
      </div>

      {/* Botón */}
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

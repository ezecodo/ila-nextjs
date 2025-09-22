import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DonationBanner() {
  const t = useTranslations("donation");

  // Ruta del botón según idioma (ajústala si tus rutas son otras)
  const donateHref = "/donar";

  return (
    <div className="bg-red-600 text-white p-6 shadow-lg flex flex-col items-center text-center gap-4">
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

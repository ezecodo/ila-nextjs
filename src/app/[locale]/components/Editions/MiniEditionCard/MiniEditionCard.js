import Image from "next/image";
import Link from "next/link";
import EntityBadges from "../../EntityBadges/EntityBadges";
import { useLocale } from "next-intl";

export default function MiniEditionCard({ edition }) {
  const locale = useLocale();

  // 👉 Lógica de precios
  let price;
  if (edition.isSpecialOffer) {
    price = "ab 2,40 € (Sonderangebot)";
  } else {
    const year = edition.datePublished
      ? new Date(edition.datePublished).getFullYear()
      : null;

    price = year && year >= 2025 ? "7,00 €" : "6,00 €";
  }

  const date = edition.datePublished
    ? new Date(edition.datePublished).toLocaleDateString(
        locale === "es" ? "es-ES" : "de-DE",
        {
          year: "numeric",
          month: "long",
        }
      )
    : "";

  return (
    <div className="flex flex-col items-center text-center p-4">
      {/* Portada con badges encima */}
      <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded">
        <Link href={`/editions/${edition.id}`}>
          <Image
            src={edition.coverImage || "/ila-logo.png"}
            alt={`ila ${edition.number}`}
            fill
            className="object-contain"
          />
        </Link>

        {/* Badges montados abajo de la imagen */}
        {(edition.regions?.length > 0 || edition.topics?.length > 0) && (
          <div
            className="absolute bottom-0 left-0 w-full px-2 py-1 
            bg-gradient-to-t from-white/80 via-white/60 to-transparent 
            dark:from-black/70 dark:via-black/40 backdrop-blur-sm"
          >
            <EntityBadges
              regions={edition.regions || []}
              topics={edition.topics || []}
              context="editions"
              locale={locale}
              disableLinks={true}
            />
          </div>
        )}
      </div>

      {/* Info edición */}
      <h3
        className="text-lg font-bold"
        style={{ fontFamily: "'Futura Cyrillic', Arial, sans-serif" }}
      >
        ila {edition.number}
      </h3>
      <p className="text-sm text-gray-500">{date}</p>

      {/* Precio */}
      <p className="mt-1 font-semibold text-red-600">{price}</p>
    </div>
  );
}

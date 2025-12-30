// app/[locale]/about/network/page.tsx
"use client";

import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NetworkPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    async function fetchPartners() {
      try {
        const res = await fetch("/api/network");
        const data = await res.json();
        setPartners(data);
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-red-700 dark:text-red-400 mb-8">
        {locale === "es" ? "Red de colaboración" : "Netzwerk"}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {partners.map((partner) => (
          <Link
            key={partner.id}
            href={partner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            {partner.logoUrl && (
              <div className="w-full h-32 relative mb-3">
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            <h3 className="font-semibold text-center text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400">
              {partner.name}
            </h3>

            {(locale === "es"
              ? partner.descriptionEs
              : partner.description) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                {locale === "es" ? partner.descriptionEs : partner.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

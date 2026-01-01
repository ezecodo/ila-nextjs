// components/DynamicBanner/DynamicBanner.jsx
"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function DynamicBanner({ position = "top" }) {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    async function fetchBanner() {
      try {
        const res = await fetch(`/api/banners?position=${position}`);
        const data = await res.json();

        if (data && data.length > 0) {
          setBanner(data[0]);
        }
      } catch (error) {
        console.error("Error fetching banner:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBanner();
  }, [position]);

  if (loading || !banner) {
    return null;
  }

  const title =
    locale === "es" && banner.titleEs ? banner.titleEs : banner.title;
  const subtitle =
    locale === "es" && banner.subtitleEs ? banner.subtitleEs : banner.subtitle;
  const description =
    locale === "es" && banner.descriptionEs
      ? banner.descriptionEs
      : banner.description;
  const buttonText =
    locale === "es" && banner.buttonTextEs
      ? banner.buttonTextEs
      : banner.buttonText;

  const getSizeClass = (size, type) => {
    const sizes = {
      title: {
        xs: "text-xs md:text-xs",
        sm: "text-xs md:text-sm",
        md: "text-sm md:text-base",
        lg: "text-base md:text-lg",
      },
      subtitle: {
        xl: "text-lg md:text-xl",
        "2xl": "text-xl md:text-2xl",
        "3xl": "text-xl md:text-3xl",
        "4xl": "text-2xl md:text-4xl",
      },
      description: {
        sm: "text-xs md:text-sm",
        base: "text-sm md:text-base",
        lg: "text-base md:text-lg",
      },
    };
    return sizes[type][size] || "";
  };

  return (
    <div
      className="mb-0 relative overflow-hidden rounded-lg md:rounded-none shadow-md"
      style={{
        background: `linear-gradient(to bottom right, ${banner.bgGradientFrom}, ${banner.bgGradientTo})`,
      }}
    >
      {/* Patrón de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="relative px-4 md:px-8 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          {/* Logo ILA */}
          <div className="bg-white rounded-sm w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shadow-lg">
            <span
              className="text-3xl md:text-4xl font-bold text-red-600"
              style={{ fontFamily: "Futura, sans-serif" }}
            >
              ila
            </span>
          </div>

          {/* Contenido */}
          <div className="flex-1">
            {title && (
              <div
                className={`text-red-100 font-semibold uppercase tracking-wider mb-2 ${getSizeClass(banner.titleSize, "title")}`}
              >
                {title}
              </div>
            )}
            <h3
              className={`text-white font-bold leading-tight mb-2 ${getSizeClass(banner.subtitleSize, "subtitle")}`}
            >
              {subtitle}
            </h3>
            <p
              className={`text-white/90 leading-relaxed ${getSizeClass(banner.descriptionSize, "description")}`}
            >
              {description}
            </p>
          </div>

          {/* Imagen decorativa */}
          {banner.imageUrl && (
            <div className="hidden lg:flex flex-shrink-0 relative h-32 w-40">
              <Image
                src={banner.imageUrl}
                alt={subtitle}
                fill
                className="object-contain"
              />
            </div>
          )}

          {/* Botón CTA */}
          <Link href={banner.buttonUrl} className="flex-shrink-0">
            <div
              className="bg-white/95 dark:bg-gray-900/95 rounded-lg px-4 md:px-6 py-3 md:py-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border-2"
              style={{ borderColor: banner.buttonColor }}
            >
              <div className="flex items-center gap-2">
                <p
                  className="text-lg md:text-xl font-bold"
                  style={{ color: banner.buttonColor }}
                >
                  {buttonText}
                </p>
                <span
                  className="group-hover:translate-x-1 transition-transform duration-300"
                  style={{ color: banner.buttonColor }}
                >
                  →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

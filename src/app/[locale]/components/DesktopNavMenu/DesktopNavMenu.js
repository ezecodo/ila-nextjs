"use client";
import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import SearchBar from "../SearchBar";
import { navSections } from "./navMenuConfig";

export default function DesktopNavMenu({
  isMobile = false,
  invert = false,
  onLinkClick,
  onSearch,
}) {
  const t = useTranslations("navMenu");
  const { data: session } = useSession();

  const [openSections, setOpenSections] = useState(new Set());

  const toggleSection = (sectionKey) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(sectionKey)) {
      newOpenSections.delete(sectionKey);
    } else {
      newOpenSections.add(sectionKey);
    }
    setOpenSections(newOpenSections);
  };
  const handleSearch = () => {
    setOpenSections(new Set()); // 1. Cierra todas las secciones del acordeón
    onLinkClick?.(); // 2. Cierra el menú hamburguesa completo (si existe)
    onSearch?.(); // 3. Notifica al padre si es necesario
  };
  const isSectionOpen = (sectionKey) => openSections.has(sectionKey);

  // Estilos condicionales para modo invertido (texto blanco sobre fondo rojo)
  const textColor = invert
    ? "text-white hover:text-white/80"
    : "text-gray-800 dark:text-gray-100 hover:text-[#cc0000] dark:hover:text-red-400";

  const borderColor = invert
    ? "border-white/30"
    : "border-gray-200 dark:border-gray-700";

  // ─── MÓVIL: acordeón + auth + locale ─────────────────────────────────
  if (isMobile) {
    return (
      <nav>
        <ul className="flex flex-col gap-1 text-lg font-medium text-center">
          {session && (
            <li className="py-2 text-base font-semibold">
              {t("greeting", { name: session.user.name })}
            </li>
          )}

          {navSections.map((sec) => (
            <React.Fragment key={sec.labelKey}>
              {!sec.items ? (
                <li className="py-2">
                  <Link
                    href={sec.href}
                    onClick={() => {
                      setOpenSections(new Set());
                      onLinkClick?.();
                    }}
                    className="hover:text-red-600 transition-colors"
                  >
                    {t(sec.labelKey)}
                  </Link>
                </li>
              ) : (
                <>
                  <li
                    className="py-2 cursor-pointer hover:text-red-600 transition-colors"
                    onClick={() => toggleSection(sec.labelKey)}
                  >
                    {t(sec.labelKey)}
                    <span className="ml-2">
                      {isSectionOpen(sec.labelKey) ? "−" : "+"}
                    </span>
                  </li>

                  {isSectionOpen(sec.labelKey) && (
                    <ul className="flex flex-col gap-1 pl-4 text-base font-normal text-left">
                      {sec.items.map((item) => (
                        <React.Fragment key={item.labelKey}>
                          {item.items ? (
                            <>
                              <li
                                className="py-1 cursor-pointer hover:text-red-600 transition-colors flex items-center justify-between"
                                onClick={() => toggleSection(item.labelKey)}
                              >
                                <span>{t(item.labelKey)}</span>
                                <span className="mr-2">
                                  {isSectionOpen(item.labelKey) ? "−" : "+"}
                                </span>
                              </li>
                              {isSectionOpen(item.labelKey) && (
                                <ul className="flex flex-col gap-1 pl-6 text-sm border-l border-gray-200 dark:border-gray-700">
                                  {item.items.map((sub) => (
                                    <li key={sub.href}>
                                      <Link
                                        href={sub.href}
                                        onClick={() => {
                                          setOpenSections(new Set());
                                          onLinkClick?.();
                                        }}
                                        className="block py-1 hover:underline"
                                      >
                                        {t(sub.labelKey)}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          ) : (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => {
                                  setOpenSections(new Set());
                                  onLinkClick?.();
                                }}
                                className="block py-1 hover:underline text-gray-800 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                              >
                                {t(item.labelKey)}
                              </Link>
                            </li>
                          )}
                        </React.Fragment>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </React.Fragment>
          ))}

          <li className="pt-4 px-4">
            <SearchBar onSearch={handleSearch} />
          </li>

          <li>
            <hr className="border-gray-200 dark:border-gray-700 my-4" />
          </li>
        </ul>
      </nav>
    );
  }

  // ─── DESKTOP: horizontal + dropdown + SearchBar ────────────────────────
  return (
    <nav className="relative inline-block mb-0 pb-0">
      <div className="flex items-center gap-8 relative">
        {navSections.map((sec) =>
          sec.items ? (
            <div key={sec.labelKey} className="relative group">
              <span
                className={`text-[13px] font-bold uppercase tracking-wide ${textColor} transition-colors cursor-pointer py-3 block`}
              >
                {t(sec.labelKey)}
              </span>

              {/* Puente invisible para mantener hover */}
              <div className="absolute left-0 top-full w-full h-4" />

              {/* Dropdown estilizado */}
              <ul className="absolute left-0 top-[100%] pt-2 w-64 bg-white dark:bg-gray-800 rounded-b-md shadow-xl opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 z-[100] border-t-2 border-[#cc0000]">
                {sec.items.map((item) =>
                  item.items ? (
                    <li
                      key={item.labelKey}
                      className="relative group/item border-b border-gray-50 dark:border-gray-700 last:border-0"
                    >
                      <span className="flex justify-between items-center px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        {t(item.labelKey)}{" "}
                        <span className="text-[10px]">▶</span>
                      </span>

                      {/* Submenú lateral */}
                      <ul className="absolute left-[100%] top-0 min-w-[18rem] bg-white dark:bg-gray-800 rounded-md shadow-2xl opacity-0 invisible group-hover/item:visible group-hover/item:opacity-100 transition-all duration-200 z-[101] border-l border-gray-100 dark:border-gray-700">
                        {item.items.map((sub) => (
                          <li
                            key={sub.href}
                            className="border-b border-gray-50 dark:border-gray-700 last:border-0"
                          >
                            <Link
                              href={sub.href}
                              className="block px-5 py-3 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-700 hover:text-[#cc0000] transition-colors"
                            >
                              {t(sub.labelKey)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li
                      key={item.href}
                      className="border-b border-gray-50 dark:border-gray-700 last:border-0"
                    >
                      <Link
                        href={item.href}
                        className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ) : (
            <Link
              key={sec.labelKey}
              href={sec.href}
              className={`text-[13px] font-bold uppercase tracking-wide ${textColor} transition-colors py-3 block`}
            >
              {t(sec.labelKey)}
            </Link>
          )
        )}

        {/* Buscador integrado sin bordes pesados */}
        <div className={`pl-6 border-l ${borderColor} h-6 flex items-center`}>
          <SearchBar onSearch={handleSearch} invert={invert} />
        </div>
      </div>
    </nav>
  );
}

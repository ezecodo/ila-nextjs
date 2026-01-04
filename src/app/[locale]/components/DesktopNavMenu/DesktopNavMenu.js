"use client";
import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import SearchBar from "../SearchBar";
import { navSections } from "./navMenuConfig";

export default function DesktopNavMenu({
  isMobile = false,
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
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-md dark:shadow-lg relative inline-block">
      <div className="flex items-center gap-6 relative">
        {navSections.map((sec) =>
          sec.items ? (
            <div key={sec.labelKey} className="relative group static">
              <span className="font-semibold text-gray-800 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer py-2">
                {t(sec.labelKey)}
              </span>

              {/* Puente invisible para mantener hover */}
              <div className="absolute left-0 top-full w-full h-2 opacity-0 group-hover:opacity-100" />

              {/* Dropdown con delay reducido */}
              <ul className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded shadow-lg dark:shadow-gray-900 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-150 z-[100]">
                {sec.items.map((item) =>
                  item.items ? (
                    <li
                      key={item.labelKey}
                      className="relative group/item static"
                    >
                      <span className="block px-4 py-2 font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        {t(item.labelKey)} →
                      </span>

                      {/* Puente invisible para submenú */}
                      <div className="absolute left-full top-0 w-2 h-full opacity-0 group-hover/item:opacity-100" />

                      {/* Submenú con delay reducido */}
                      <ul className="absolute left-full top-0 min-w-[16rem] bg-white dark:bg-gray-800 rounded shadow-lg dark:shadow-gray-900 opacity-0 invisible group-hover/item:visible group-hover/item:opacity-100 transition-all duration-150 whitespace-normal z-[101]">
                        {item.items.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400"
                            >
                              {t(sub.labelKey)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              className="font-semibold hover:text-red-600 transition-colors"
            >
              {t(sec.labelKey)}
            </Link>
          )
        )}

        <div className="pl-6 border-l border-gray-300 dark:border-gray-600">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
    </nav>
  );
}

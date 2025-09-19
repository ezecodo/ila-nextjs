"use client";
import React, { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

import { useTranslations } from "next-intl";
import { FaUser, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";
import SearchBar from "../SearchBar";
import { navSections } from "./navMenuConfig";

export default function DesktopNavMenu({ isMobile = false, onLinkClick }) {
  const t = useTranslations("navMenu");
  const { data: session } = useSession();

  const [openSection, setOpenSection] = useState(null);

  // ─── MÓVIL: acordeón + auth + locale ─────────────────────────────────
  if (isMobile) {
    return (
      <nav>
        <ul className="flex flex-col gap-1 text-lg font-medium text-center">
          {/* 1) Saludo */}
          {session && (
            <li className="py-2 text-base font-semibold">
              {t("greeting", { name: session.user.name })}
            </li>
          )}

          {/* 2) Secciones desplegables */}
          {navSections.map((sec) => (
            <React.Fragment key={sec.labelKey}>
              <li
                className="py-2 cursor-pointer hover:text-red-600 transition-colors"
                onClick={() =>
                  setOpenSection(
                    openSection === sec.labelKey ? null : sec.labelKey
                  )
                }
              >
                {t(sec.labelKey)}
              </li>
              {sec.items && openSection === sec.labelKey && (
                <ul className="flex flex-col gap-1 pl-6 text-base font-normal">
                  {sec.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          setOpenSection(null);
                          onLinkClick?.();
                        }}
                        className="block py-1 hover:underline"
                      >
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </React.Fragment>
          ))}

          {/* 3) SearchBar */}
          <li className="pt-4 px-4">
            <SearchBar />
          </li>

          {/* 4) Separador */}
          <li>
            <hr className="border-gray-200 dark:border-gray-700 my-4" />
          </li>

          {/* 5) Dashboard / Logout / Login */}
          <li className="flex justify-center items-center gap-4">
            {session ? (
              <>
                <Link
                  href={
                    session.user.role === "admin"
                      ? "/dashboard"
                      : "/dashboard-users"
                  }
                  onClick={onLinkClick}
                  className="flex items-center gap-2"
                >
                  <FaTachometerAlt />
                  {t("dashboard")}
                </Link>
                <button
                  onClick={() => {
                    signOut({ redirect: false });
                    onLinkClick?.();
                  }}
                  className="flex items-center gap-2"
                >
                  <FaSignOutAlt />
                  {t("logout")}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  signIn();
                  onLinkClick?.();
                }}
                className="flex items-center gap-2"
              >
                <FaUser />
                {t("login")}
              </button>
            )}
          </li>
        </ul>
      </nav>
    );
  }

  // ─── DESKTOP: horizontal + dropdown + SearchBar ────────────────────────
  // ─── DESKTOP: horizontal + dropdown + SearchBar ────────────────────────
  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 py-2 rounded-lg shadow-md dark:shadow-lg">
      <div className="flex items-center justify-center gap-8">
        {navSections.map((sec) =>
          sec.items ? (
            <div key={sec.labelKey} className="relative group">
              <span className="font-semibold text-gray-800 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                {t(sec.labelKey)}
              </span>

              <ul className="absolute left-0 top-full w-56 bg-white dark:bg-gray-800 rounded shadow-lg dark:shadow-gray-900 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-opacity">
                {sec.items.map((item) =>
                  item.items ? (
                    // 👉 Submenú "Service"
                    <li key={item.labelKey} className="relative group/item">
                      <span className="block px-4 py-2 font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                        {t(item.labelKey)}
                      </span>
                      <ul className="absolute left-full top-0 min-w-[16rem] bg-white dark:bg-gray-800 rounded shadow-lg dark:shadow-gray-900 opacity-0 invisible group-hover/item:visible group-hover/item:opacity-100 transition-opacity whitespace-normal">
                        {item.items.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              {t(sub.labelKey)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    // 👉 Item normal
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
            // 👉 Caso "Home" (sin items)
            <Link
              key={sec.labelKey}
              href={sec.href}
              className="font-semibold hover:text-red-600 transition-colors"
            >
              {t(sec.labelKey)}
            </Link>
          )
        )}

        {/* SearchBar al final, mismo look */}
        <div className="ml-8 w-64">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}

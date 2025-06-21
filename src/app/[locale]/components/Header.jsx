"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaUser, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";

import styles from "./Header.module.css";
import SearchBar from "./SearchBar";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("header");

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode, mounted]);
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const dashboardRoute =
    session?.user?.role === "admin" ? "/dashboard" : "/dashboard-users";

  return (
    <header className={styles.header}>
      {/* 🔹 Línea superior (desktop) - Auth + idioma */}
      <div className="w-full hidden md:flex justify-end items-center px-4 py-1 gap-2">
        {session && (
          <span className={styles.welcomeText}>
            {t("greeting", { name: session.user?.name || "Usuario" })}
          </span>
        )}
        {session ? (
          <>
            <Link href={dashboardRoute}>
              <button className={styles.iconButton}>
                <FaTachometerAlt />
              </button>
            </Link>
            <button className={styles.iconButton} onClick={() => signOut()}>
              <FaSignOutAlt />
            </button>
          </>
        ) : (
          <button className={styles.iconButton} onClick={() => signIn()}>
            <FaUser />
          </button>
        )}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
            aria-label="Toggle dark mode"
          />
          <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-black transition-colors" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center text-[10px] transition-transform transform peer-checked:translate-x-5">
            {darkMode ? "🌙" : "☀️"}
          </div>
        </label>
        <div className={styles.languageSwitcher}>
          <button
            onClick={() => router.replace(pathname, { locale: "es" })}
            className={styles.langButton}
          >
            ES
          </button>
          <button
            onClick={() => router.replace(pathname, { locale: "de" })}
            className={styles.langButton}
          >
            DE
          </button>
        </div>
      </div>

      {/* 🔹 Mobile top: logo + menú */}
      <div className="w-full flex md:hidden items-center justify-between px-4 py-2">
        <button
          className={`${styles.menuButton}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <FaBars size={24} />
        </button>
        <Link href="/" className="flex flex-col items-center gap-0.5 mx-auto">
          <Image src="/ila-logo.png" alt="ILA Logo" width={40} height={40} />
          <span className="text-sm font-medium text-center">
            {t("tagline")}
          </span>
        </Link>
      </div>

      {/* 🔹 Línea principal (desktop) */}
      <div className="w-full hidden md:flex items-center px-4 py-3 relative">
        {/* Logo + título a la izquierda, fuera del flujo */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/ila-logo.png" alt="ILA Logo" width={40} height={40} />
            <span className="text-base font-medium whitespace-nowrap">
              {t("tagline")}
            </span>
          </Link>
        </div>

        {/* Centro: menú + búsqueda centrado */}
        <div className="mx-auto flex items-center gap-6">
          <nav className="flex items-center gap-4">
            <ul className={styles.menu}>
              <li>
                <Link href="/">{t("nav.home")}</Link>
              </li>
              <li>
                <Link href="/about">{t("nav.about")}</Link>
              </li>
              <li>
                <Link href="/articles">{t("nav.articles")}</Link>
              </li>
              <li>
                <Link href="/#dossiers">{t("nav.editions")}</Link>
              </li>
              <li>
                <Link href="/events">{t("nav.events")}</Link>
              </li>
            </ul>
            <SearchBar />
          </nav>
        </div>
      </div>

      {/* 🔹 Menú mobile desplegado */}
      {menuOpen && (
        <div className="w-full md:hidden px-4 pb-6 pt-2 space-y-6 bg-white dark:bg-gray-900 shadow-md">
          {/* Menú de navegación */}
          <nav className="space-y-3">
            <ul className="flex flex-col gap-2 text-lg font-semibold text-center text-gray-900 dark:text-white">
              <li>
                <Link href="/" onClick={() => setMenuOpen(false)}>
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link href="/about" onClick={() => setMenuOpen(false)}>
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href="/articles" onClick={() => setMenuOpen(false)}>
                  {t("nav.articles")}
                </Link>
              </li>
              <li>
                <Link href="/#dossiers">{t("nav.editions")}</Link>
              </li>
              <li>
                <Link href="/events" onClick={() => setMenuOpen(false)}>
                  {t("nav.events")}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Buscador */}
          <div className="w-full">
            <SearchBar />
          </div>

          {/* Controles */}
          {/* Controles en una sola línea */}
          <div className="flex flex-wrap justify-center items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm">
            {session && (
              <span className="font-semibold text-center">
                {t("greeting", { name: session.user?.name || "Usuario" })}
              </span>
            )}

            {session ? (
              <>
                <Link href={dashboardRoute}>
                  <button className={styles.iconButton}>
                    <FaTachometerAlt />
                  </button>
                </Link>
                <button className={styles.iconButton} onClick={handleSignOut}>
                  <FaSignOutAlt />
                </button>
              </>
            ) : (
              <button className={styles.iconButton} onClick={() => signIn()}>
                <FaUser />
              </button>
            )}

            <button
              onClick={() => router.replace(pathname, { locale: "es" })}
              className={styles.langButton}
            >
              ES
            </button>
            <button
              onClick={() => router.replace(pathname, { locale: "de" })}
              className={styles.langButton}
            >
              DE
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

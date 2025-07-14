"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaUser, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";

import styles from "./Header.module.css";

import { useLocale } from "next-intl";
import DesktopNavMenu from "./DesktopNavMenu/DesktopNavMenu";

export default function Header() {
  const locale = useLocale();
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
      {/* Mobile top */}
      <div className="w-full flex md:hidden items-center justify-between px-4 py-2">
        <button
          className={styles.menuButton}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <FaBars size={24} />
        </button>
        <Link href="/" className="flex flex-col items-center gap-0.5 mx-auto">
          <Image src="/ila-logo.png" alt="ILA Logo" width={40} height={40} />
          <span
            className="text-sm font-medium text-center"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            {t("tagline")}
          </span>
        </Link>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="w-full md:hidden px-4 pb-6 pt-2 bg-white dark:bg-gray-900 shadow-md">
          <DesktopNavMenu
            isMobile={true}
            onLinkClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      {/* Desktop top: auth + locale */}
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
            <button className={styles.iconButton} onClick={handleSignOut}>
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

      {/* Desktop main */}
      <div className="w-full hidden md:flex flex-col px-4 pt-2 pb-0">
        {/* Logo centrado y tagline debajo */}
        <div className="flex flex-col items-center mb-0">
          <Link href="/" className="flex flex-col items-center">
            <Image
              src="/ila-logo.png"
              alt="ILA Logo"
              width={120}
              height={120}
            />
            <span
              className="mt-2 text-2xl md:text-3xl font-bold whitespace-nowrap text-center"
              style={{
                fontFamily: "'Futura Cyrillic', Arial, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              {locale === "es" ? (
                <>
                  La revista de Latinoam
                  <span
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    e
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: "0.24em",
                        top: "0.25em",
                        width: "0.21em",
                        height: "0.10em",
                        background: "#222",
                        borderRadius: "0.03em",
                        transform: "rotate(-18deg)",
                        zIndex: 2,
                      }}
                    />
                  </span>
                  rica
                </>
              ) : (
                t("tagline")
              )}
            </span>
          </Link>

          {/* Nav + Search en la misma línea, perfectamente alineados */}
          <div className="flex items-center justify-center gap-8">
            <DesktopNavMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBars, FaUser, FaSignOutAlt, FaTachometerAlt } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

import styles from "./Header.module.css";

import { useLocale } from "next-intl";
import DesktopNavMenu from "./DesktopNavMenu/DesktopNavMenu";

export default function Header() {
  const [isCompact, setIsCompact] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("header");
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const queryParam = query ? `?query=${encodeURIComponent(query)}` : "";

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
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 🔽 Si estás muy abajo y bajando → compactar
      if (currentScrollY > 150 && currentScrollY > lastScrollY) {
        setIsCompact(true);
      }

      // 🔼 Si estás completamente arriba (top 0) → expandir
      if (currentScrollY <= 0) {
        setIsCompact(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
    <header className={`${styles.header} ${isCompact ? styles.compact : ""}`}>
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

      {/* Desktop compact */}
      {isCompact && (
        <div className="hidden md:flex w-full px-4 py-2">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-[auto,1fr,auto] items-center">
            {/* Logo a la izquierda */}
            <Link href="/" className="justify-self-start">
              <Image
                src="/ila-logo.png"
                alt="ILA Logo"
                width={40}
                height={40}
              />
            </Link>

            {/* Menú perfectamente CENTRADO */}
            <div className="justify-self-center overflow-x-visible whitespace-nowrap">
              <DesktopNavMenu />
            </div>

            {/* Espaciador a la derecha (si luego quieres, pon aquí SearchBar u otro control) */}
            <div className="justify-self-end" />
            {/* Ejemplo con buscador:
      <div className="justify-self-end w-[360px]">
        <SearchBar />
      </div>
      */}
          </div>
        </div>
      )}

      {/* Desktop top: auth + locale */}
      {!isCompact && (
        <div className="w-full hidden md:flex justify-center px-4 py-1">
          <div className="max-w-7xl w-full flex justify-end items-center gap-2">
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
                onClick={() =>
                  router.replace(`${pathname}${queryParam}`, { locale: "es" })
                }
                className={styles.langButton}
              >
                ES
              </button>
              <button
                onClick={() =>
                  router.replace(`${pathname}${queryParam}`, { locale: "de" })
                }
                className={styles.langButton}
              >
                DE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop main */}
      {!isCompact && (
        <div className="w-full hidden md:flex px-4 pt-2 pb-0">
          <div className="max-w-7xl mx-auto w-full">
            {/* Fila superior: logo IZQ + tagline CENTRO */}
            {/* Fila superior: logo fijo a la IZQ + tagline CENTRO */}
            <div className="relative flex items-center h-[96px]">
              {/* Logo: fijo respecto al contenedor, no depende del menú */}
              <Link
                href="/"
                className="absolute left-[8rem] md:left-[12rem] flex items-center"
                aria-label="ILA Home"
              >
                <Image
                  src="/ila-logo.png"
                  alt="ILA Logo"
                  width={80}
                  height={80}
                  priority
                />
              </Link>

              {/* Tagline perfectamente centrado en el contenedor */}
              <div
                className="mx-auto text-center relative"
                style={{ left: "-10px" }}
              >
                <span
                  className="text-[1.9rem] md:text-[2.4rem] font-bold leading-tight whitespace-nowrap"
                  style={{
                    fontFamily: "'Futura Cyrillic', Arial, sans-serif",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {locale === "es" ? (
                    <>
                      La revista de Am
                      <span
                        style={{
                          position: "relative",
                          display: "inline-block",
                        }}
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
                            background: "#222", // 👈 mismo color que el texto
                            borderRadius: "0.03em",
                            transform: "rotate(-18deg)",
                            zIndex: 2,
                          }}
                        />
                      </span>
                      rica Latina
                    </>
                  ) : (
                    t("tagline")
                  )}
                </span>
              </div>
            </div>

            {/* Fila inferior: menú centrado en una sola línea */}
            <div className="flex items-center justify-center py-2">
              <div className="shrink-0 overflow-x-visible whitespace-nowrap">
                <DesktopNavMenu />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

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
  const pathname = usePathname();
  const isDashboard = pathname?.includes("/dashboard");

  const [isCompact, setIsCompact] = useState(isDashboard);
  const [lastScrollY, setLastScrollY] = useState(0);
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("header");
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const queryParam = query ? `?query=${encodeURIComponent(query)}` : "";

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return true;
      }
      return savedTheme === "dark";
    }
    return false;
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isDashboard) {
      setIsCompact(true);
    } else {
      setIsCompact(window.scrollY > 150);
    }
  }, [isDashboard]);

  useEffect(() => {
    if (isDashboard) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 150 && currentScrollY > lastScrollY) {
        setIsCompact(true);
      }

      if (currentScrollY <= 0) {
        setIsCompact(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isDashboard]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      if (e.matches) {
        setDarkMode(true);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [mounted]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  let dashboardRoute = "/dashboard-users";

  if (session?.user?.role === "admin") {
    dashboardRoute = "/dashboard";
  } else if (session?.user?.role === "translator") {
    dashboardRoute = "/dashboard/translators";
  } else if (session?.user?.role === "k2") {
    dashboardRoute = "/dashboard/k2";
  }

  return (
    <header className={`${styles.header} ${isCompact ? styles.compact : ""}`}>
      {/* Mobile top */}
      <div className="w-full flex md:hidden items-center px-4 py-2">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <Image src="/ila-logo.png" alt="ila Logo" width={45} height={45} />
          <span
            className="text-base md:text-lg font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[55vw] text-center"
            style={{ fontFamily: "Futura Cyrillic, Arial, sans-serif" }}
          >
            {t("tagline")}
          </span>
        </Link>

        <div className="ml-auto flex flex-col items-center gap-1 w-10">
          <div className="text-xs font-semibold uppercase tracking-wide text-center">
            {locale === "de" && (
              <button
                onClick={() =>
                  router.replace(`${pathname}${queryParam}`, { locale: "es" })
                }
              >
                ES
              </button>
            )}
            {locale === "es" && (
              <button
                onClick={() =>
                  router.replace(`${pathname}${queryParam}`, { locale: "de" })
                }
              >
                DE
              </button>
            )}
          </div>

          <button
            className="p-2 text-current"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <FaBars size={20} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="w-full md:hidden px-4 pb-6 pt-2 bg-white dark:bg-gray-900 shadow-md flex flex-col gap-4">
          <DesktopNavMenu
            isMobile={true}
            onLinkClick={() => setMenuOpen(false)}
          />

          <div className="flex items-center justify-center gap-4 mt-4">
            {session ? (
              <>
                <Link href={dashboardRoute} onClick={() => setMenuOpen(false)}>
                  <button className="p-2 rounded-full bg-red-700 text-white">
                    <FaTachometerAlt />
                  </button>
                </Link>
                <button
                  className="p-2 rounded-full bg-red-700 text-white"
                  onClick={() => {
                    handleSignOut();
                    setMenuOpen(false);
                  }}
                >
                  <FaSignOutAlt />
                </button>
              </>
            ) : (
              <button
                className="p-2 rounded-full bg-red-700 text-white"
                onClick={() => {
                  signIn();
                  setMenuOpen(false);
                }}
              >
                <FaUser />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop compact - ACTUALIZADO con controles a la derecha */}
      {isCompact && (
        <div className="hidden md:flex w-full px-4 py-2 overflow-visible">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-4 overflow-visible">
            {/* Logo a la izquierda */}
            <Link href="/" className="shrink-0">
              <Image
                src="/ila-logo.png"
                alt="ILA Logo"
                width={40}
                height={40}
              />
            </Link>

            {/* 🎯 SOLUCIÓN FLEXBOX: Menú ocupa todo el espacio disponible */}
            <div className="flex-1 flex justify-center min-w-0">
              <div className="whitespace-nowrap min-w-0">
                <div className="overflow-x-auto overflow-y-visible">
                  <DesktopNavMenu />
                </div>
              </div>
            </div>

            {/* Controles a la derecha - siempre visibles */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {session && (
                <span className={styles.welcomeText}>
                  {t("greeting", { name: session.user?.name || "Usuario" })}
                </span>
              )}

              {/* Menú de usuario unificado con dropdown */}
              {session ? (
                <div className="relative group pointer-events-none">
                  <button
                    className={`${styles.iconButton} pointer-events-auto`}
                  >
                    <FaUser />
                  </button>
                  <div className="hidden group-hover:block absolute right-0 top-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 min-w-[140px] z-50 pointer-events-auto">
                    <Link
                      href={dashboardRoute}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FaTachometerAlt className="text-xs" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <FaSignOutAlt className="text-xs" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button className={styles.iconButton} onClick={() => signIn()}>
                  <FaUser />
                </button>
              )}

              {/* Dark mode toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  aria-label="Toggle dark mode"
                />
                <div className="w-10 h-5 bg-gray-300 rounded-full peer-checked:bg-black transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-gray-200 flex items-center justify-center text-[10px]">
                  {mounted ? (darkMode ? "🌙" : "☀️") : "☀️"}
                </div>
              </label>

              {/* Language switcher */}
              <div className={styles.languageSwitcher}>
                {locale === "de" && (
                  <button
                    onClick={() =>
                      router.replace(`${pathname}${queryParam}`, {
                        locale: "es",
                      })
                    }
                    className={styles.langButton}
                  >
                    ES
                  </button>
                )}
                {locale === "es" && (
                  <button
                    onClick={() =>
                      router.replace(`${pathname}${queryParam}`, {
                        locale: "de",
                      })
                    }
                    className={styles.langButton}
                  >
                    DE
                  </button>
                )}
              </div>
            </div>
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
              <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-gray-200 flex items-center justify-center text-[10px]">
                {mounted ? (darkMode ? "🌙" : "☀️") : "☀️"}
              </div>
            </label>

            <div className={styles.languageSwitcher}>
              {locale === "de" && (
                <button
                  onClick={() =>
                    router.replace(`${pathname}${queryParam}`, { locale: "es" })
                  }
                  className={styles.langButton}
                >
                  ES
                </button>
              )}
              {locale === "es" && (
                <button
                  onClick={() =>
                    router.replace(`${pathname}${queryParam}`, { locale: "de" })
                  }
                  className={styles.langButton}
                >
                  DE
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop main */}
      {!isCompact && (
        <div className="w-full hidden md:flex px-4 pt-2 pb-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-center gap-4 h-[96px] lg:gap-6">
              <div className="justify-self-start">
                <Link
                  href="/"
                  aria-label="ILA Home"
                  className="flex items-center"
                >
                  <Image
                    src="/ila-logo.png"
                    alt="ILA Logo"
                    width={80}
                    height={80}
                    priority
                  />
                </Link>
              </div>

              <div className="text-center xl:whitespace-nowrap whitespace-normal">
                <span
                  className="text-[1.4rem] lg:text-[1.9rem] xl:text-[2.4rem] font-bold leading-tight"
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
                            background: "#222",
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

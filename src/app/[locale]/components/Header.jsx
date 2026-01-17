"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import Link from "next/link";

import IlaLogo from "../components/IlaLogo/IlaLogo";

import styles from "./Header.module.css";

import { useLocale } from "next-intl";
import DesktopNavMenu from "./DesktopNavMenu/DesktopNavMenu";
import LatinAmericaBackground from "../components/LatinAmericaBackground/LatinAmericaBackground";
import {
  FaBars,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaTachometerAlt,
  FaSun,
  FaMoon,
} from "react-icons/fa";

export default function Header() {
  const pathname = usePathname();
  const isDashboard = pathname?.includes("/dashboard");

  const [isCompact, setIsCompact] = useState(isDashboard);
  const [lastScrollY, setLastScrollY] = useState(0);
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("header");

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

      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
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

  const handleLocaleSwitch = (newLocale) => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const edition = params.get("edition");
      if (edition) {
        sessionStorage.setItem("preferredEditionNumber", edition);
      }
      const current = new URL(window.location.href);
      const destPath = `${pathname}${current.search || ""}`;
      router.replace(destPath, { locale: newLocale });
    }
  };

  return (
    // 🔴 CAMBIO AQUÍ: Added 'fixed top-0 left-0 w-full z-50' and 'md:relative'
    <header
      className={`${styles.header} fixed top-0 left-0 w-full z-50 md:sticky md:top-0 shadow-md ${isCompact ? styles.compact : ""}`}
    >
      {/* --- BARRA NEGRA SUPERIOR (Ancho total de pantalla) --- */}
      {/* --- BARRA NEGRA SUPERIOR (Minimalismo Total) --- */}
      <div className="hidden md:flex w-full bg-black text-white py-px px-4 justify-center border-b border-black/20">
        <div className="w-full max-w-[1400px] flex justify-end items-center gap-6 text-[11px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-4">
            {/* Saludo de usuario (Solo si hay sesión) */}
            {session && (
              <span
                className="hidden sm:inline text-[10px] opacity-70 lowercase font-normal border-r border-white/20 pr-4"
                title={t("user_profile")}
              >
                {t("greeting", { name: session.user?.name || "Usuario" })}
              </span>
            )}

            {/* Switcher de Idioma Dinámico */}
            <div className="text-[11px] font-bold hover:text-red-500 transition-colors cursor-pointer">
              {locale === "es" ? (
                <button
                  onClick={() => handleLocaleSwitch("de")}
                  title="Auf Deutsch umstellen"
                >
                  DE
                </button>
              ) : (
                <button
                  onClick={() => handleLocaleSwitch("es")}
                  title="Cambiar a Español"
                >
                  ES
                </button>
              )}
            </div>

            {/* Toggle Dark Mode con Icono */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-all"
              title={darkMode ? t("switch_light") : t("switch_dark")}
            >
              {darkMode ? (
                <FaSun className="text-yellow-400" size={16} />
              ) : (
                <FaMoon className="text-gray-300" size={14} />
              )}
            </button>

            {/* Acciones de Sesión (Dashboard y Login/Logout) */}
            <div className="flex items-center gap-1">
              {session && (
                <Link href={dashboardRoute}>
                  <button
                    className="p-1.5 rounded-full hover:bg-white/10 transition-all text-white"
                    title={t("dashboard_access")}
                  >
                    <FaTachometerAlt size={14} />
                  </button>
                </Link>
              )}

              <button
                onClick={() => (session ? handleSignOut() : signIn())}
                className="p-1.5 rounded-full hover:bg-white/10 transition-all text-white"
                title={session ? t("logout") : t("login")}
              >
                {session ? (
                  <FaSignOutAlt size={14} />
                ) : (
                  <FaSignInAlt size={14} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile top */}
      <div className="w-screen flex md:hidden items-center bg-[#e60000] text-white relative overflow-hidden -mx-4 h-14">
        <LatinAmericaBackground variant="mobile" />

        {/* Contenedor relativo para que el tagline absoluto se base en este ancho */}
        <div className="relative z-10 w-full h-full flex items-center justify-between">
          {/* 1. LOGO (Izquierda) */}
          <Link
            href="/"
            className="bg-white w-14 h-full flex items-center justify-center shadow-sm z-20 flex-shrink-0"
          >
            <IlaLogo
              size="mini"
              isLink={false}
              variant="red-solid"
              className="transform scale-75"
            />
          </Link>

          {/* 2. TAGLINE (Centrado Absoluto Real) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-14">
            <span
              className="futura text-[clamp(1.05rem,5vw,1.42rem)] font-bold text-white whitespace-nowrap leading-none tracking-tighter text-center pointer-events-auto"
              style={{ transform: "translateY(1px)" }}
            >
              {locale === "es" ? (
                <>
                  La revista de Am
                  <span
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    e
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: "0.24em",
                        top: "0.12em", // 🎯 El "punto dulce"
                        width: "0.17em",
                        height: "0.08em",
                        background: "#fff",
                        borderRadius: "0.03em",
                        transform: "rotate(-35deg)",
                        zIndex: 2,
                      }}
                    />
                  </span>
                  rica Latina
                </>
              ) : (
                "Das Lateinamerika-Magazin"
              )}
            </span>
          </div>

          {/* 3. CONTROLES (Derecha) */}
          <div className="bg-white w-14 h-full flex flex-col items-center justify-center shadow-sm z-20 flex-shrink-0">
            <div className="text-[11px] font-black text-[#e60000] mb-0.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleLocaleSwitch(locale === "es" ? "de" : "es");
                }}
              >
                {locale === "es" ? "DE" : "ES"}
              </button>
            </div>
            <button
              className="text-[#e60000]"
              onClick={(e) => {
                e.preventDefault();
                toggleMenu();
              }}
            >
              <FaBars size={20} />
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {/* 🔴 CAMBIO AQUÍ: Added z-[60] to ensure it sits above the fixed header if needed, though typically fixed elements stack based on DOM order or explicit z-index */}
      {menuOpen && (
        <div className="fixed left-0 right-0 md:hidden px-4 pb-6 pt-2 bg-white dark:bg-gray-900 shadow-lg flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 max-h-[calc(100vh-80px)] overflow-y-auto z-[60]">
          <DesktopNavMenu
            isMobile={true}
            onLinkClick={() => setMenuOpen(false)}
            onSearch={() => setMenuOpen(false)}
          />

          <div className="flex items-center justify-center gap-6 mt-4">
            {session ? (
              <>
                <Link href={dashboardRoute} onClick={() => setMenuOpen(false)}>
                  <button className="p-3 rounded-full bg-red-700 text-white hover:bg-red-800 transition-colors">
                    <FaTachometerAlt />
                  </button>
                </Link>
                <button
                  className="p-3 rounded-full bg-red-700 text-white hover:bg-red-800 transition-colors"
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
                className="p-3 rounded-full bg-red-700 text-white hover:bg-red-800 transition-colors"
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

      {/* Desktop compact */}

      {/* --- CUERPO DEL HEADER EN ROJO (Fuerza Total) --- */}
      <div
        className={`hidden md:block w-full bg-[#e60000] text-white transition-all duration-300 relative ${isCompact ? "py-0" : "pt-2 pb-4"}`}
      >
        {/* 🌎 Fondo tipográfico con nombres de países (solo en modo expandido) */}
        {!isCompact && <LatinAmericaBackground />}

        <div
          className={`mx-auto px-6 relative z-10 ${isCompact ? "w-full py-1" : "max-w-[1400px]"}`}
        >
          {/* Layout Flex con alineación centrada */}
          <div
            className={`flex items-center justify-center ${isCompact ? "gap-4" : "gap-8"}`}
          >
            {/* LOGO */}
            <IlaLogo
              size={isCompact ? "mini" : "default"}
              animated={true}
              animationType="hover-scale"
              variant="white-solid"
              className={isCompact ? "translate-y-1 -my-3" : ""}
            />

            {/* TAGLINE - Alineación Precisa */}
            {!isCompact && (
              <div className="hidden lg:block">
                <h1
                  className="futura text-[2.2rem] xl:text-[3rem] font-bold text-white leading-none tracking-normal"
                  style={{
                    marginLeft: "-15px", // Espacio negativo suave para acercar, pero no tanto
                    transform: "translateY(15px)", // Baja el texto 10px para alinear visualmente con la base de "ila"
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
                            // 🔧 CAMBIO: Antes estaba en 0.32em.
                            // Al bajar el número (ej. 0.18em), el acento sube.
                            top: "0.18em",
                            width: "0.17em",
                            height: "0.08em",
                            background: "#fff",
                            borderRadius: "0.03em",
                            transform: "rotate(-35deg)",
                            zIndex: 2,
                          }}
                        />
                      </span>
                      rica Latina
                    </>
                  ) : (
                    t("tagline")
                  )}
                </h1>
              </div>
            )}

            {/* MENÚ EN MODO COMPACTO */}
            {isCompact && (
              <div className="flex items-center">
                <DesktopNavMenu invert={true} />
              </div>
            )}
          </div>

          {/* SECCIÓN DEL MENÚ (Isla Blanca) */}
          {!isCompact && (
            <div className="-mt-2 flex justify-center">
              {" "}
              {/* mt-8 → mt-2 (más cerca) */}
              <div className="bg-white dark:bg-gray-900 px-8 py-0 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] border border-white/20 flex items-center">
                <DesktopNavMenu />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

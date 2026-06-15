"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import React, { useState, useEffect, useRef } from "react";
import SearchBar from "./SearchBar";
import confetti from "canvas-confetti";
import Link from "next/link";

import IlaLogo50 from "../components/IlaLogo/ilaLogo50";
import CartButton from "./Cart/CartButton";

import styles from "./Header.module.css";

import { useLocale } from "next-intl";
import DesktopNavMenu from "./DesktopNavMenu/DesktopNavMenu";
import LatinAmericaBackground from "../components/LatinAmericaBackground/LatinAmericaBackground";
import { navSections } from "./DesktopNavMenu/navMenuConfig";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaTachometerAlt,
  FaSun,
  FaMoon,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";

export default function Header() {
  const pathname = usePathname();
  const isDashboard = pathname?.includes("/dashboard");
  const isMap = pathname?.endsWith("/map");
  // Páginas que arrancan (y se quedan) con el header comprimido
  const forceCompact = isDashboard || isMap;

  const [isCompact, setIsCompact] = useState(forceCompact);
  const rafRef = useRef(null);
  const prevScrollYRef = useRef(0);
  const directionStartRef = useRef(0);
  const directionRef = useRef("none");
  const locale = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("header");
  const tNav = useTranslations("navMenu");
  const [showPopup50, setShowPopup50] = useState(false);
  const [activeMobileSection, setActiveMobileSection] = useState(null);
  const logoRef = useRef(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
  const launchConfetti = () => {
    // Primera ráfaga
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { x: 0.5, y: 0.3 },
      colors: ["#89B881", "#BD0E0D", "#ffffff", "#FFD700", "#00A86B"],
      scalar: 1.5, // 👈 más grandes (default es 1)
    });

    // Segunda ráfaga desde la izquierda
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { x: 0.3, y: 0.4 },
        colors: ["#89B881", "#BD0E0D", "#ffffff", "#FFD700", "#00A86B"],
        scalar: 1.5,
      });
    }, 150);

    // Tercera ráfaga desde la derecha
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { x: 0.7, y: 0.4 },
        colors: ["#89B881", "#BD0E0D", "#ffffff", "#FFD700", "#00A86B"],
        scalar: 1.5,
      });
    }, 300);
  };

  const handleLogoHover = () => {
    // Si es admin, NO mostrar popup ni confeti
    if (session?.user?.role === "admin") {
      return; // Salir sin hacer nada
    }

    if (!showPopup50) {
      launchConfetti();
      setShowPopup50(true);
    }
  };
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (forceCompact) {
      setIsCompact(true);
    } else {
      setIsCompact(window.scrollY > 150);
    }
  }, [forceCompact]);

  useEffect(() => {
    if (forceCompact) return;

    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const delta = scrollY - prevScrollYRef.current;

        // Detectar cambio de dirección
        if (delta > 2 && directionRef.current !== "down") {
          directionRef.current = "down";
          directionStartRef.current = prevScrollYRef.current;
        } else if (delta < -2 && directionRef.current !== "up") {
          directionRef.current = "up";
          directionStartRef.current = prevScrollYRef.current;
        }

        setIsCompact((prev) => {
          // Colapsar: solo si llevamos 100px scrolleando hacia abajo desde la última dirección
          if (!prev && scrollY > 300 && directionRef.current === "down" && scrollY > directionStartRef.current + 100) {
            return true;
          }
          // Expandir: si volvemos al top o llevamos 80px scrolleando hacia arriba
          if (prev && (scrollY < 80 || (directionRef.current === "up" && scrollY < directionStartRef.current - 80))) {
            return false;
          }
          return prev;
        });

        prevScrollYRef.current = scrollY;
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [forceCompact]);

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

  useEffect(() => {
    setShowUserMenu(false);
    setMenuOpen(false);
  }, [pathname]);

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
      {/* Mobile top */}
      <div className="w-full flex md:hidden items-center bg-[#BD0E0D] text-white relative overflow-hidden h-14">
        <LatinAmericaBackground variant="mobile" />

        {/* Contenedor relativo para que el tagline absoluto se base en este ancho */}
        <div className="relative z-10 w-full h-full flex items-center justify-between">
          {/* 1. LOGO (Izquierda) - Cambiado fondo a rojo */}
          <Link
            href="/"
            className="bg-[#BD0E0D] w-16 h-full flex items-center justify-center shadow-sm z-20 flex-shrink-0"
          >
            <IlaLogo50
              size="mobile"
              show50={true}
              isLink={false}
              animated={true}
              animationType="fifty-pulse"
              className="transform scale-75 -translate-y-1"
            />
          </Link>

          {/* 2. TAGLINE */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16 z-30">
            <span
              className="futura text-[clamp(1.1rem,5.5vw,1.6rem)] font-bold text-white whitespace-nowrap leading-none tracking-tight text-center pointer-events-auto"
              style={{ transform: "translateY(1px) translateX(13px)" }}
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
                        top: "0.12em",
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
          <div className="bg-[#BD0E0D] h-full flex items-center justify-end gap-2 pr-2 z-20 flex-shrink-0">
          <div className="w-10 h-full flex flex-col items-center justify-center">
            <div className="text-[10px] font-black text-white mb-0.5 leading-none">
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
              className="text-white flex items-center justify-center transition-transform duration-200"
              onClick={(e) => {
                e.preventDefault();
                toggleMenu();
              }}
              aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            >
              {menuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>
        </div>
      </div>
      {/* Mobile menu */}
      {/* 🔴 CAMBIO AQUÍ: Added z-[60] to ensure it sits above the fixed header if needed, though typically fixed elements stack based on DOM order or explicit z-index */}
      {menuOpen && (
        <div
          className="fixed left-0 right-0 bottom-0 z-[60] md:hidden flex flex-col bg-[#BD0E0D] animate-in slide-in-from-top-1 duration-200"
          style={{ top: "3.5rem" }}
        >
          {/* ── Navegación ── */}
          <nav className="overflow-y-auto">
            {navSections.map((section) => {
              const isOpen = activeMobileSection === section.labelKey;

              if (!section.items) {
                return (
                  <Link
                    key={section.labelKey}
                    href={section.href}
                    onClick={() => {
                      setMenuOpen(false);
                      setActiveMobileSection(null);
                    }}
                    className="flex items-center px-6 py-3 text-white font-bold text-base tracking-wide border-b border-white/10 hover:bg-white/8 active:bg-white/15 transition-colors"
                  >
                    {tNav(section.labelKey)}
                  </Link>
                );
              }

              return (
                <div key={section.labelKey}>
                  <button
                    onClick={() =>
                      setActiveMobileSection(isOpen ? null : section.labelKey)
                    }
                    className="w-full flex items-center justify-between px-6 py-3 text-white font-bold text-base tracking-wide border-b border-white/10 hover:bg-white/8 active:bg-white/15 transition-colors"
                  >
                    <span>{tNav(section.labelKey)}</span>
                    <span
                      className={`text-white/50 text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    >
                      ▾
                    </span>
                  </button>

                  {isOpen && (
                    <div className="bg-black/15 border-b border-white/10">
                      {section.items.map((item) => {
                        if (item.items) {
                          return (
                            <React.Fragment key={item.labelKey}>
                              <div className="flex items-center px-8 py-1.5 text-white/40 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                {tNav(item.labelKey)}
                              </div>
                              {item.items.map((sub) => (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={() => {
                                    setMenuOpen(false);
                                    setActiveMobileSection(null);
                                  }}
                                  className="flex items-center gap-2 pl-10 pr-6 py-2.5 text-white/70 text-sm border-b border-white/5 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                  <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
                                  {tNav(sub.labelKey)}
                                </Link>
                              ))}
                            </React.Fragment>
                          );
                        }
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => {
                              setMenuOpen(false);
                              setActiveMobileSection(null);
                            }}
                            className="flex items-center gap-2 pl-8 pr-6 py-3 text-white/80 text-sm border-b border-white/5 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <span className="w-1 h-1 rounded-full bg-white/40 flex-shrink-0" />
                            {tNav(item.labelKey)}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* ── Buscador ── */}
          <div className="flex-shrink-0 px-5 py-4 border-t border-white/15">
            <SearchBar
              onSearch={() => {
                setMenuOpen(false);
                setActiveMobileSection(null);
              }}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* ── Barra inferior ── */}
          <div className="flex-shrink-0 border-t border-white/20 px-5 py-4 flex items-center justify-between">
            {/* Social */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/ila.web"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook size={17} />
              </a>
              <a
                href="https://www.instagram.com/ila_bonn/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram size={17} />
              </a>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleLocaleSwitch(locale === "es" ? "de" : "es")
                }
                className="text-white font-black futura text-sm px-3 py-2 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
              >
                {locale === "es" ? "DE" : "ES"}
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              >
                {darkMode ? (
                  <FaSun size={16} className="text-yellow-300" />
                ) : (
                  <FaMoon size={15} />
                )}
              </button>
              {session ? (
                <>
                  <Link
                    href={dashboardRoute}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors">
                      <FaTachometerAlt size={15} />
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMenuOpen(false);
                    }}
                    className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                  >
                    <FaSignOutAlt size={15} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    signIn();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#BD0E0D] font-bold text-sm hover:bg-white/90 transition-colors"
                >
                  <FaUser size={13} />
                  {locale === "es" ? "Iniciar sesión" : "Anmelden"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Desktop compact */}

      {/* --- CUERPO DEL HEADER EN ROJO (Fuerza Total) --- */}
      <div
        className={`hidden md:block w-full bg-[#BD0E0D] text-white transition-all duration-300 relative ${isCompact ? "py-0" : "pt-1 pb-2"}`}
      >
        {/* 🌎 Fondo tipográfico — siempre montado para evitar el flash del estado interno */}
        <div
          className={`transition-opacity duration-300 ${isCompact ? "opacity-0" : "opacity-100"}`}
        >
          <LatinAmericaBackground />
        </div>

        <div
          className={`mx-auto px-6 relative z-10 ${isCompact ? "w-full py-1" : "max-w-[1400px]"}`}
        >
          {/* Layout Flex con alineación centrada */}
          <div
            className={`flex items-center justify-center ${isCompact ? "gap-4" : "gap-8"}`}
          >
            {/* LOGO */}
            {/* LOGO */}
            <div className="relative" ref={logoRef}>
              <IlaLogo50
                size={isCompact ? "mini" : "default"}
                show50={true}
                isLink={true}
                animated={true}
                animationType={isCompact ? "hover-scale" : "fifty-pulse-green"}
                variant="white-solid"
                className={isCompact ? "-translate-y-1 -my-3" : ""}
                on50Hover={
                  session?.user?.role !== "admin" ? handleLogoHover : undefined
                }
                on50Leave={
                  session?.user?.role !== "admin"
                    ? () => setShowPopup50(false)
                    : undefined
                }
              />

              {/* Popup 50 años */}
              {/* Popup 50 años - Modal centrado */}
              {showPopup50 && (
                <>
                  {/* Overlay oscuro */}
                  <div
                    className="fixed inset-0 bg-black/40 z-40"
                    onMouseEnter={() => setShowPopup50(false)}
                  />

                  {/* Modal centrado */}
                  {/* Modal centrado */}
                  <div
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-2xl bg-[#89B881] text-white p-8 md:p-10 rounded-none shadow-2xl border-t-4 border-green-700 animate-in fade-in zoom-in-95 duration-300"
                    onMouseLeave={() => setShowPopup50(false)}
                  >
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-6 text-center futura">
                      {locale === "es" ? "¡Cumplimos 50!" : "Wir werden 50!"}
                    </h3>

                    <p
                      className="text-lg md:text-xl leading-relaxed font-medium text-white/95 mb-8 text-center"
                      style={{
                        fontFamily:
                          "'Inter', 'Segoe UI', system-ui, sans-serif",
                      }}
                    >
                      {locale === "es"
                        ? 'Sería tiempo de colgar los guantes y relajarse. ¿En un mundo donde el presidente de EE. UU. vuelve a hacer de "América para los estadounidenses" la guía de su política y el canciller alemán solo ve todo esto como "complejo"? ¿En un presente donde las fuerzas de derecha están en auge y, sin embargo, en todas partes la gente resiste día a día, luchando por una buena vida y sociedades solidarias? Celebramos y seguimos. ¿Y tú?'
                        : 'Es wäre Zeit, die ila an den Nagel zu hängen und sich zurückzulehnen. In einer Welt in der der US-Präsident "Amerika den (US-)Amerikanern" wieder zur Leitlinie seiner Politik macht und der deutsche Kanzler das Ganze nur als "komplex" sehen kann? In einer Gegenwart wo rechte Kräfte im Vormarsch sind und dennoch überall Menschen tagtäglich widerstehen, für ein gutes Leben und solidarische Gesellschaften kämpfen? Wir feiern und machen weiter. Und ihr?'}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      <Link
                        href="/order/abo"
                        className="bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg futura"
                      >
                        {locale === "es" ? "Suscríbete" : "Abonnieren"}
                      </Link>
                      <Link
                        href="/support/participate"
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg futura"
                      >
                        {locale === "es" ? "Únete" : "Mitmachen"}
                      </Link>
                      <Link
                        href="/support/donations"
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 text-center border border-white/30 hover:border-white/50 transition-all duration-200 hover:scale-[1.02] text-base md:text-lg futura"
                      >
                        {locale === "es" ? "Dona" : "Spenden"}
                      </Link>
                    </div>

                    {/* Botón cerrar */}
                    <button
                      onClick={() => setShowPopup50(false)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <span className="text-white text-2xl leading-none">
                        &times;
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

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
              <div className="flex items-center gap-4">
                <DesktopNavMenu invert={true} locale={locale} onLocaleSwitch={handleLocaleSwitch} />

                {/* Controles compactos sobre el rojo */}
                <div className="border-l border-white/20 pl-4 flex items-center gap-3">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    title={darkMode ? t("switch_light") : t("switch_dark")}
                    className="flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    {darkMode ? <FaSun size={12} className="text-yellow-300" /> : <FaMoon size={11} />}
                  </button>

                  {session ? (
                    <div
                      className="relative flex items-center"
                      onMouseEnter={() => setShowUserMenu(true)}
                      onMouseLeave={() => setShowUserMenu(false)}
                    >
                      <div className="text-[10px] text-white/80 font-bold futura flex items-center cursor-pointer hover:text-white transition-colors gap-1.5">
                        <span className="capitalize">{locale === "es" ? "hola" : "hallo"}</span>
                        <span className="font-medium italic">{session.user?.name || "User"}</span>
                        <svg
                          className={`w-2 h-2 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showUserMenu && (
                        <div className="absolute top-full right-0 w-40 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <Link
                            href={dashboardRoute}
                            className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#BD0E0D] transition-colors"
                          >
                            <FaTachometerAlt size={12} />
                            {t("dashboard_access")}
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-50 dark:border-gray-700"
                          >
                            <FaSignOutAlt size={12} />
                            {t("logout")}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => signIn()}
                      className="text-[10px] font-bold futura text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <FaSignInAlt size={11} />
                      {t("login")}
                    </button>
                  )}
                  <CartButton locale={locale} variant="light" size={13} />
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN DEL MENÚ (Isla Blanca) */}
          {!isCompact && (
            <div className="-mt-5 flex justify-center">
              <div className="bg-white dark:bg-gray-900 px-8 py-0 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] border border-white/20 flex items-center h-8 overflow-visible">
                <DesktopNavMenu locale={locale} onLocaleSwitch={handleLocaleSwitch} />

                {/* Controles: dark mode + usuario */}
                <div className="border-l border-gray-200 dark:border-gray-700 ml-4 pl-4 h-5 flex items-center gap-3">
                  {/* Dark mode */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    title={darkMode ? t("switch_light") : t("switch_dark")}
                    className="flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#BD0E0D] dark:hover:text-red-400 transition-colors"
                  >
                    {darkMode ? <FaSun size={12} className="text-yellow-500" /> : <FaMoon size={11} />}
                  </button>

                  {/* Usuario */}
                  {session ? (
                    <div
                      className="relative h-full flex items-center"
                      onMouseEnter={() => setShowUserMenu(true)}
                      onMouseLeave={() => setShowUserMenu(false)}
                    >
                      <div className="text-[10px] text-gray-700 dark:text-gray-200 font-bold flex items-center cursor-pointer hover:text-[#BD0E0D] transition-colors gap-1.5">
                        <span className="futura tracking-tight">
                          <span className="capitalize">{locale === "es" ? "hola" : "hallo"}</span>
                          <span className="ml-1 font-medium italic">{session.user?.name || "User"}</span>
                        </span>
                        <svg
                          className={`w-2 h-2 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showUserMenu && (
                        <div className="absolute top-full right-0 w-40 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl z-[100] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                          <Link
                            href={dashboardRoute}
                            className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-[#BD0E0D] transition-colors"
                          >
                            <FaTachometerAlt size={12} />
                            {t("dashboard_access")}
                          </Link>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-50 dark:border-gray-700"
                          >
                            <FaSignOutAlt size={12} />
                            {t("logout")}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => signIn()}
                      className="text-[10px] font-bold futura text-gray-500 dark:text-gray-400 hover:text-[#BD0E0D] dark:hover:text-red-400 transition-colors flex items-center gap-1.5"
                    >
                      <FaSignInAlt size={11} />
                      {t("login")}
                    </button>
                  )}
                  {/* Carrito */}
                  <CartButton locale={locale} variant="dark" size={13} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

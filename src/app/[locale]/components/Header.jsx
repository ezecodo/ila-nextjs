"use client";

import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

import React, { useState } from "react";
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

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const dashboardRoute =
    session?.user?.role === "admin" ? "/dashboard" : "/dashboard-users";

  return (
    <header className={styles.header}>
      {/* 🔹 Top bar: hamburguesa + auth/idioma (solo desktop) */}
      <div className="w-full flex items-center justify-between px-4 mt-2">
        {/* 🔹 Botón hamburguesa visible solo en mobile */}
        <button
          className={`${styles.menuButton} block md:hidden`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <FaBars size={24} />
        </button>

        {/* 🔹 Auth + idioma visible solo en desktop */}
        <div className="hidden md:flex items-center gap-2 ml-auto">
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
      </div>

      {/* 🔹 Logo + título centrado */}
      <div className="w-full flex flex-col items-center mt-3 mb-2">
        <Link href="/" className="flex flex-col items-center gap-1">
          <Image src="/ila-logo.png" alt="ILA Logo" width={48} height={48} />
          <span className="text-xl font-bold text-center">{t("tagline")}</span>
        </Link>
      </div>
      {/* 🔹 Auth + idioma visibles solo en mobile */}
      {menuOpen && (
        <div className="flex items-center justify-center gap-3 mt-4 md:hidden flex-wrap">
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
      )}

      {/* 🔹 Navegación */}
      <nav className={`${styles.nav} ${menuOpen ? styles.active : ""}`}>
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
            <Link href="/editions">{t("nav.editions")}</Link>
          </li>
          <li>
            <Link href="/events">{t("nav.events")}</Link>
          </li>
        </ul>

        <SearchBar />
      </nav>
    </header>
  );
};

export default Header;

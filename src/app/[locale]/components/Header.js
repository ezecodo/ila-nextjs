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
      <div className={styles.headerTop}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image
              src="/ila-logo.png"
              alt="ILA Logo"
              width={50}
              height={50}
              className={styles.logo}
            />
          </Link>
          <span className="text-lg font-bold mt-4 mb-2">{t("tagline")}</span>
        </div>

        <div className={styles.authButtons}>
          {session ? (
            <>
              <span className={styles.welcomeText}>
                {t("greeting", { name: session.user?.name || "Usuario" })}
              </span>
              <Link href={dashboardRoute}>
                <button className={styles.iconButton}>
                  <FaTachometerAlt size={16} />
                </button>
              </Link>
              <button className={styles.iconButton} onClick={handleSignOut}>
                <FaSignOutAlt size={16} />
              </button>
            </>
          ) : (
            <>
              <button className={styles.iconButton} onClick={() => signIn()}>
                <FaUser size={16} />
              </button>
            </>
          )}

          {/* 🔹 Selector de idioma SIEMPRE visible */}
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

      <button
        className={styles.menuButton}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <FaBars size={24} />
      </button>

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

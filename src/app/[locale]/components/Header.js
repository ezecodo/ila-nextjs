"use client";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaBars,
  FaUser,
  FaUserPlus,
  FaSignOutAlt,
  FaTachometerAlt,
} from "react-icons/fa"; // Íconos
import styles from "./Header.module.css";
import SearchBar from "./SearchBar";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const Header = () => {
  const t = useTranslations("header");

  const { data: session } = useSession(); // 🔥 Obtener la sesión del usuario
  const router = useRouter(); // ✅ Instanciamos el router
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Cambiar estado del menú
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false }); // 🔥 Evita la redirección automática de NextAuth
    router.push("/"); // ✅ Redirige manualmente a la página de inicio
  };

  // 🔥 Definir la ruta del Dashboard según el rol del usuario
  const dashboardRoute =
    session?.user?.role === "admin" ? "/dashboard" : "/dashboard-users";

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        {/* Logo y tagline */}
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

        {/* 🔥 Botones de autenticación + Nombre del usuario */}
        <div className={styles.authButtons}>
          {session ? (
            <>
              {/* 🔹 Mensaje de bienvenida con el nombre */}
              <span className={styles.welcomeText}>
                {t("greeting", { name: session.user?.name || "Usuario" })}
              </span>

              {/* 🔹 Dashboard (Redirige según el rol) */}
              <Link href={dashboardRoute}>
                <button className={styles.iconButton}>
                  <FaTachometerAlt size={16} />
                </button>
              </Link>

              {/* 🔹 Logout */}
              <button className={styles.iconButton} onClick={handleSignOut}>
                <FaSignOutAlt size={16} />
              </button>
            </>
          ) : (
            <>
              {/* 🔹 Login */}
              <button className={styles.iconButton} onClick={() => signIn()}>
                <FaUser size={16} />
              </button>

              {/* 🔹 Signup */}
              <Link href="/auth/signup">
                <button className={styles.iconButton}>
                  <FaUserPlus size={16} />
                </button>
              </Link>
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
            </>
          )}
        </div>
      </div>

      {/* Botón hamburguesa */}
      <button
        className={styles.menuButton}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <FaBars size={24} /> {/* 🔥 Usa un ícono confiable */}
      </button>

      {/* Menú de navegación */}
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

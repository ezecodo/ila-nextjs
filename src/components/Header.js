"use client";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaUser,
  FaUserPlus,
  FaSignOutAlt,
  FaTachometerAlt,
} from "react-icons/fa"; // Íconos
import styles from "./Header.module.css";
import SearchBar from "@/components/SearchBar";

const Header = () => {
  const { data: session } = useSession(); // 🔥 Obtener la sesión del usuario
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen); // Cambiar estado del menú
  };

  const reloadPage = () => {
    window.location.href = "/"; // Forzar recarga completa
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        {/* Logo y tagline */}
        <div className={styles.logoContainer}>
          <a onClick={reloadPage} style={{ cursor: "pointer" }}>
            <Image
              src="/ila-logo.png"
              alt="ILA Logo"
              width={50}
              height={50}
              className={styles.logo}
            />
          </a>

          <span className="text-lg font-bold mt-4 mb-2">
            Das Lateinamerika-Magazin
          </span>
        </div>

        {/* 🔥 Botones de autenticación + Nombre del usuario */}
        <div className={styles.authButtons}>
          {session ? (
            <>
              {/* 🔹 Mensaje de bienvenida con el nombre */}
              <span className={styles.welcomeText}>
                Hola, {session.user?.name || "Usuario"} 👋
              </span>

              {/* 🔹 Dashboard */}
              <Link href="/dashboard">
                <button className={styles.iconButton}>
                  <FaTachometerAlt size={16} />
                </button>
              </Link>

              {/* 🔹 Logout */}
              <button className={styles.iconButton} onClick={() => signOut()}>
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
        ☰
      </button>

      {/* Menú de navegación */}
      <nav className={`${styles.nav} ${menuOpen ? styles.active : ""}`}>
        <ul className={styles.menu}>
          <li>
            <Link href="/">Inicio</Link>
          </li>
          <li>
            <Link href="/about">Sobre Nosotros</Link>
          </li>
          <li>
            <Link href="/articles">Artículos</Link>
          </li>
          <li>
            <Link href="/contact">Contacto</Link>
          </li>
        </ul>
        <SearchBar />
      </nav>
    </header>
  );
};

export default Header;

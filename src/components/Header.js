"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const reloadPage = () => {
    window.location.href = "/"; // Forzar recarga completa
  };

  return (
    <header className={styles.header}>
      {/* Contenedor del logo */}
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
        <span className={styles.tagline}>Das Lateinamerika-Magazin</span>
      </div>

      {/* Botón para abrir/cerrar el menú en dispositivos móviles */}
      <button
        className={styles.menuButton}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Navegación principal */}
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
      </nav>

      {/* Botones "Iniciar Sesión" y "Registrarse" */}
      <div className={styles.authButtons}>
        <Link href="/login">
          <button className={styles.loginButton}>Iniciar Sesión</button>
        </Link>
        <Link href="/register">
          <button className={styles.registerButton}>Registrarse</button>
        </Link>
      </div>
    </header>
  );
};

export default Header;

"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaUser, FaUserPlus } from "react-icons/fa"; // Íconos
import styles from "./Header.module.css";
import SearchBar from "@/components/SearchBar";

const Header = () => {
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

        {/* Botones de autenticación */}
        <div className={styles.authButtons}>
          <Link href="/login">
            <button className={styles.iconButton}>
              <FaUser size={16} />
            </button>
          </Link>
          <Link href="/register">
            <button className={styles.iconButton}>
              <FaUserPlus size={16} />
            </button>
          </Link>
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

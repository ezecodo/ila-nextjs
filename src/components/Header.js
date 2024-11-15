// src/components/Header.js
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

const Header = () => (
  <header className={styles.header}>
    <div className={styles.logoContainer}>
      {/* Cambiar de <img> a <Image> */}
      <Image
        src="/ila-logo.png"
        alt="ILA Logo"
        width={50} // Ajusta el tamaño del logo según lo necesites
        height={50} // Ajusta el tamaño del logo según lo necesites
        className={styles.logo}
      />
      <span className={styles.tagline}>Das Lateinamerika-Magazin</span>
    </div>
    <nav className={styles.nav}>
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
  </header>
);

export default Header;

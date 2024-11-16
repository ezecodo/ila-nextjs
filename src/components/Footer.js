// src/components/Footer.js
import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image
          src="/ila-logo.png"
          alt="ILA Logo"
          width={50} // Cambia el tamaño si es necesario
          height={50} // Cambia el tamaño si es necesario
          className={styles.logo}
        />
      </div>
      <p className={styles.text}>© 2024 ILA - Das Lateinamerika-Magazin</p>
      <ul className={styles.socials}>
        <li>
          <Link
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </Link>
        </li>
        <li>
          <Link
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </Link>
        </li>
        <li>
          <Link
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </Link>
        </li>
      </ul>
    </div>
  </footer>
);

export default Footer;

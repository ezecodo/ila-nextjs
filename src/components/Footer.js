// src/components/Footer.js
import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa"; // Importa los iconos
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
            href="https://www.facebook.com/ila.web"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebookF className={styles.icon} /> {/* Icono de Facebook */}
          </Link>
        </li>
        <li>
          <Link
            href="https://x.com/ila_Bonn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTwitter className={styles.icon} /> {/* Icono de Twitter/X */}
          </Link>
        </li>
        <li>
          <Link
            href="https://www.instagram.com/ila_bonn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaInstagram className={styles.icon} /> {/* Icono de Instagram */}
          </Link>
        </li>
      </ul>
    </div>
  </footer>
);

export default Footer;

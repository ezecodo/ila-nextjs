// src/components/Footer.js
import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import Image from "next/image";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <Image
            src="/ila-logo.png"
            alt="ila logo"
            width={50}
            height={50}
            className={styles.logo}
          />
        </div>
        <p className={styles.text}>
          © <span className={styles.logoText}>ila</span> – Informationsstelle
          Lateinamerika e.V. Bonn 2025
        </p>
        <ul className={styles.socials}>
          <li>
            <Link
              href="https://www.facebook.com/ila.web"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaFacebook className={styles.icon} aria-label="Facebook" />
            </Link>
          </li>
          <li>
            <Link
              href="https://www.instagram.com/ila_bonn/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaInstagram className={styles.icon} aria-label="Instagram" />
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;

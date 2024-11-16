// src/components/Footer.js
import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import Image from "next/image";
import styles from "./Footer.module.css";

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.container}>
      <div className={styles.logoContainer}>
        <Image
          src="/ila-logo.png"
          alt="ILA Logo"
          width={50}
          height={50}
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
        <li>
          <Link
            href="https://x.com/ila_Bonn"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* Usamos un SVG inline para el logo de X */}
            <span className={styles.icon} aria-label="X">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="24px"
                height="24px"
              >
                <path d="M23.07 0H16.9L12 7.2 7.14 0H.93L9.9 11.7 0 24h6.14l5.85-7.74L17.93 24H24l-9.93-12.28L23.07 0z" />
              </svg>
            </span>
          </Link>
        </li>
      </ul>
    </div>
  </footer>
);

export default Footer;

// src/components/Footer.js
import Link from "next/link";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import Image from "next/image";
import styles from "./Footer.module.css";
import { useTranslations } from "next-intl";

const Footer = () => {
  const t = useTranslations("Footer"); // Namespace Footer

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
          © 2025 <span className={styles.logoText}>ila</span> - {t("tagline")}
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

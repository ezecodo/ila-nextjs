// src/components/Footer.js
import styles from "./Footer.module.css";

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.container}>
      <div className={styles.info}>
        <p>ILA - Das Lateinamerika-Magazin</p>
        <p>Email: info@ila-web.de</p>
        <p>Tel: +49 228 123 456</p>
      </div>
      <div className={styles.links}>
        <a href="/privacy">Política de Privacidad</a>
        <a href="/terms">Términos y Condiciones</a>
      </div>
      <div className={styles.socials}>
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook
        </a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          Twitter
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram
        </a>
      </div>
    </div>
    <div className={styles.copy}>
      <p>&copy; 2024 ILA. Todos los derechos reservados.</p>
    </div>
  </footer>
);

export default Footer;

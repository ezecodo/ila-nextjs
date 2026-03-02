"use client";
// src/components/Footer.js
import { Link } from "@/i18n/navigation";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { useTranslations } from "next-intl";
import IlaLogo50 from "./IlaLogo/ilaLogo50";
import styles from "./Footer.module.css";

export default function Footer() {
  const t = useTranslations("navMenu");
  const tf = useTranslations("Footer");

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* TOP GRID */}
        <div className={styles.grid}>
          {/* Columna 1: Marca */}
          <div className={styles.brand}>
            <IlaLogo50
              size="mini"
              isLink={false}
              animated={true}
              animationType="hover-scale"
              show50={true}
            />
            <p className={styles.tagline}>{tf("tagline")}</p>
            <p className={styles.description}>{tf("description")}</p>
            <div className={styles.socials}>
              <a
                href="https://www.facebook.com/ila.web"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Facebook"
              >
                <FaFacebook size={16} />
              </a>
              <a
                href="https://www.instagram.com/ila_bonn/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label="Instagram"
              >
                <FaInstagram size={16} />
              </a>
            </div>
          </div>

          {/* Columna 2: Magazin */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>{tf("magazineSection")}</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/contents/current-issue" className={styles.link}>
                  {t("currentIssue")}
                </Link>
              </li>
              <li>
                <Link href="/archive" className={styles.link}>
                  {t("archive")}
                </Link>
              </li>
              <li>
                <Link href="/aktuell/aktuelles" className={styles.link}>
                  {t("news")}
                </Link>
              </li>
              <li>
                <Link href="/events" className={styles.link}>
                  {t("events")}
                </Link>
              </li>
              <li>
                <Link href="/contents/online-only" className={styles.link}>
                  {t("onlineOnly")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Über uns */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>{t("aboutUs")}</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/about/history" className={styles.link}>
                  {t("history")}
                </Link>
              </li>
              <li>
                <Link href="/about/editorial" className={styles.link}>
                  {t("editorialTeam")}
                </Link>
              </li>
              <li>
                <Link href="/about/network" className={styles.link}>
                  {t("network")}
                </Link>
              </li>
              <li>
                <Link href="/about/contact" className={styles.link}>
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Unterstützen */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>{t("supportIla")}</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/support/donations" className={styles.link}>
                  {t("donate")}
                </Link>
              </li>
              <li>
                <Link href="/order/abo" className={styles.link}>
                  {t("subscription")}
                </Link>
              </li>
              <li>
                <Link href="/order/single-dossier-order" className={styles.link}>
                  {t("singleIssue")}
                </Link>
              </li>
              <li>
                <Link href="/support/participate" className={styles.link}>
                  {t("getInvolved")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* DIVISOR */}
        <div className={styles.divider} />

        {/* BOTTOM BAR */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © <span className={styles.logoText}>ila</span> – Informationsstelle
            Lateinamerika e.V. Bonn 2026
          </p>
          <ul className={styles.legal}>
            <li>
              <Link href="/about/legal" className={styles.legalLink}>
                {t("legalNotice")}
              </Link>
            </li>
            <li>
              <Link href="/about/privacy" className={styles.legalLink}>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/about/agb" className={styles.legalLink}>
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

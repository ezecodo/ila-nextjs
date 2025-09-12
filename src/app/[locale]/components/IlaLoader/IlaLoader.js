// components/ILALoader.js
"use client";

import styles from "./ilaloader.module.css";

export default function IlaLoader() {
  return (
    <div className={styles.loader}>
      <h1 className={`${styles.text} font-futura`}>ila</h1>
    </div>
  );
}

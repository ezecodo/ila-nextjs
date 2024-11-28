import styles from "../NewArticlePage.module.css";

export default function SubmitButton({ label }) {
  return (
    <button type="submit" className={styles.submitButton}>
      {label}
    </button>
  );
}

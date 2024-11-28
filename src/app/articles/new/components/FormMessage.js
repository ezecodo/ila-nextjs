import styles from "../NewArticlePage.module.css";

export default function FormMessage({ message }) {
  if (!message) return null;
  return <p className={styles.message}>{message}</p>;
}

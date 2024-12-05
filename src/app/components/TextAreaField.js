import styles from "../styles/global.module.css";

export default function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={styles.textarea}
      />
    </div>
  );
}

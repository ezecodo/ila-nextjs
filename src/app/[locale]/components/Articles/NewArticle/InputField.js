import styles from "../../../../styles/global.module.css";

export default function InputField({ label, value, onChange, placeholder, onFocus }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
}

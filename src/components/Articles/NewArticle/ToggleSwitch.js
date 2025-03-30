import styles from "../../../styles/global.module.css";

export default function ToggleSwitch({ label, checked, onChange }) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <label className={styles.switch}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
}

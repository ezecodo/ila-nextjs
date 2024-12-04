import styles from "../NewArticlePage.module.css";

export default function CheckboxField({ id, label, checked, onChange }) {
  return (
    <div className={styles.checkboxWrapper}>
      <input
        type="checkbox"
        id={id}
        className={styles.customCheckbox}
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id} className={styles.checkboxLabel}>
        {label}
      </label>
    </div>
  );
}

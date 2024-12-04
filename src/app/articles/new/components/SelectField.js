import styles from "../NewArticlePage.module.css";

export default function SelectField({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccione una opción",
}) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <select value={value} onChange={onChange} className={styles.select}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

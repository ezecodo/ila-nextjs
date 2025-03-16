import styles from "../styles/global.module.css";

export default function SelectField({
  label,
  options = [], // 🔥 Asegura que siempre tenga un array por defecto
  value,
  onChange,
  placeholder = "Seleccione una opción",
}) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <select value={value} onChange={onChange} className={styles.select}>
        <option value="">{placeholder}</option>
        {Array.isArray(options) && options.length > 0 ? (
          options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))
        ) : (
          <option disabled>Cargando opciones...</option> // 🔥 Mensaje de fallback si options está vacío
        )}
      </select>
    </div>
  );
}
